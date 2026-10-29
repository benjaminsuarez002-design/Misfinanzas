package com.misfinanzas.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.net.URLEncoder;
import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

/** Reconstructed source for Mis Finanzas widget APK. */
public class MainActivity extends Activity {
    private static final String APP_URL = "https://misfinanzas.uk/app";
    private static final String VOICE_PREFS = "misfinanzas_voice";
    private static final String VOICE_TOKEN = "voice_token";
    public static final String EXTRA_MOVEMENT_TYPE = "movement_type";
    private WebView webView;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.webView);
        findViewById(android.R.id.content).setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(0, bars.top, 0, bars.bottom);
            } else {
                view.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new AndroidBridge(), "MisFinanzasAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "misfinanzas.uk".equals(uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()) || "mailto".equals(uri.getScheme()) || "tel".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        PushService.createChannel(this);
        if (!BuildConfig.FIREBASE_ANDROID_APP_ID.isEmpty()) {
            if (FirebaseApp.getApps(this).isEmpty()) FirebaseApp.initializeApp(this, new FirebaseOptions.Builder()
                .setApplicationId(BuildConfig.FIREBASE_ANDROID_APP_ID).setProjectId("finanzas-51439")
                .setGcmSenderId("933125362701").setApiKey("AIzaSyCYTvwDEd4Hg9OCydPvrqywSmKb2gPivIk").build());
            refreshPushToken();
        }
        openIntent(getIntent());
    }

    private final class AndroidBridge {
        @JavascriptInterface public String pushToken() {
            return getSharedPreferences("misfinanzas_push", MODE_PRIVATE).getString("token", "");
        }

        @JavascriptInterface public String pushStatus() {
            if (BuildConfig.FIREBASE_ANDROID_APP_ID.isEmpty()) return "not-configured";
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return "permission-required";
            return Build.VERSION.SDK_INT < 24 || getSystemService(android.app.NotificationManager.class).areNotificationsEnabled() ? "enabled" : "disabled";
        }

        @JavascriptInterface public void requestPushPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 110);
                refreshPushToken();
            });
        }
        @JavascriptInterface public boolean tieneTokenVoz() {
            String token = getSharedPreferences(VOICE_PREFS, MODE_PRIVATE).getString(VOICE_TOKEN, "");
            return token != null && !token.trim().isEmpty();
        }

        @JavascriptInterface public void guardarTokenVoz(String token) {
            if (token == null || token.trim().isEmpty()) return;
            getSharedPreferences(VOICE_PREFS, MODE_PRIVATE).edit().putString(VOICE_TOKEN, token.trim()).apply();
        }
    }

    private void refreshPushToken() {
        if (BuildConfig.FIREBASE_ANDROID_APP_ID.isEmpty()) return;
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> {
            getSharedPreferences("misfinanzas_push", MODE_PRIVATE).edit().putString("token", token).apply();
            webView.evaluateJavascript("window.dispatchEvent(new Event('misfinanzas-push-ready'))", null);
        });
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        openIntent(intent);
    }

    private void openIntent(Intent intent) {
        String type = intent.getStringExtra(EXTRA_MOVEMENT_TYPE);
        String encoded = type;
        try { if (type != null) encoded = URLEncoder.encode(type, "UTF-8"); } catch (Exception ignored) { }
        String url = type == null || type.isEmpty() ? APP_URL : APP_URL + "?widget=1&type=" + encoded;
        if (intent.getBooleanExtra("push", false) || intent.hasExtra("eventId")) url = APP_URL + "?aviso=1";
        webView.loadUrl(url);
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
