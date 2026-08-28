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
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new AndroidBridge(), "MisFinanzasAndroid");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        openIntent(getIntent());
    }

    private final class AndroidBridge {
        @JavascriptInterface public boolean tieneTokenVoz() {
            String token = getSharedPreferences(VOICE_PREFS, MODE_PRIVATE).getString(VOICE_TOKEN, "");
            return token != null && !token.trim().isEmpty();
        }

        @JavascriptInterface public void guardarTokenVoz(String token) {
            if (token == null || token.trim().isEmpty()) return;
            getSharedPreferences(VOICE_PREFS, MODE_PRIVATE).edit().putString(VOICE_TOKEN, token.trim()).apply();
        }
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
        webView.loadUrl(url);
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
