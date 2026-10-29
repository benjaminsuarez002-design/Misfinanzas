package com.misfinanzas.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.widget.Toast;
import java.util.Locale;

/** Downloads are user-initiated; storage access is requested only when necessary. */
final class ApkDownloads {
    static final int STORAGE_REQUEST = 111;
    private final Activity activity;
    private String pendingUrl;
    private boolean confirming;

    ApkDownloads(Activity activity, Bundle state) {
        this.activity = activity;
        if (state != null) pendingUrl = state.getString("pending_apk_url");
    }

    static boolean isUpdate(Uri uri) {
        return "https".equals(uri.getScheme()) &&
            ("misfinanzas.uk".equals(uri.getHost()) || "misfinanzas.benjaminsuarez002.workers.dev".equals(uri.getHost())) &&
            uri.getPath() != null && uri.getPath().toLowerCase(Locale.ROOT).endsWith(".apk");
    }

    void ask(String url) {
        if (!isUpdate(Uri.parse(url))) {
            toast("El enlace de actualización no es válido.");
            return;
        }
        if (confirming || pendingUrl != null || activity.isFinishing()) return;
        confirming = true;
        new AlertDialog.Builder(activity)
            .setTitle("¿Descargar actualización?")
            .setMessage("El APK se guardará en Descargas. Android solicitará permiso de almacenamiento solo si esta versión del teléfono lo necesita.")
            .setPositiveButton("Descargar", (dialog, which) -> {
                pendingUrl = url;
                if (Build.VERSION.SDK_INT <= 28 && activity.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    activity.requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, STORAGE_REQUEST);
                } else enqueue();
            })
            .setNegativeButton("Cancelar", null)
            .setOnDismissListener(dialog -> confirming = false)
            .show();
    }

    void saveState(Bundle state) {
        state.putString("pending_apk_url", pendingUrl);
    }

    void permissionResult(int[] results) {
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) enqueue();
        else {
            pendingUrl = null;
            toast("No se descargó el APK porque no se autorizó el almacenamiento. Podés intentarlo otra vez desde el botón Android.");
        }
    }

    private void enqueue() {
        String url = pendingUrl;
        pendingUrl = null;
        if (url == null) return;
        try {
            Uri uri = Uri.parse(url);
            String name = uri.getLastPathSegment().replaceAll("[^A-Za-z0-9._-]", "_");
            name = name.substring(0, name.length() - 4) + "-" + System.currentTimeMillis() + ".apk";
            DownloadManager.Request request = new DownloadManager.Request(uri)
                .setTitle("Actualización de Mis Finanzas")
                .setDescription("Al finalizar, abrí el APK desde Descargas para instalarlo.")
                .setMimeType("application/vnd.android.package-archive")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null && !cookies.isEmpty()) request.addRequestHeader("Cookie", cookies);
            activity.getSystemService(DownloadManager.class).enqueue(request);
            toast("Descarga iniciada. Al finalizar, abrí el APK desde Descargas.");
        } catch (Exception error) {
            toast("No se pudo iniciar la descarga. Revisá que el gestor de descargas de Android esté habilitado y haya espacio disponible.");
        }
    }

    private void toast(String text) { Toast.makeText(activity, text, Toast.LENGTH_LONG).show(); }
}
