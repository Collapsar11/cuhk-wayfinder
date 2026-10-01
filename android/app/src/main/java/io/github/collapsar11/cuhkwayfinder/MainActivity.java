package io.github.collapsar11.cuhkwayfinder;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout root;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;
    private static final int LOCATION_REQUEST = 100;

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(250, 251, 247));
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                    | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        root.requestApplyInsets();
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        webView.setBackgroundColor(Color.rgb(250, 251, 247));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(true);
        settings.setUserAgentString(settings.getUserAgentString() + " CUHKWayfinder/" + BuildConfig.VERSION_NAME);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/app/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                // No remote subresources are needed by the bundled app. Missing files fail locally.
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null,
                    new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (LinkPolicy.isLocal(request.getUrl().toString())) return false;
                if (request.isForMainFrame()) openExternal(request.getUrl());
                return true;
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                root.removeView(view);
                view.destroy();
                webView = null;
                new AlertDialog.Builder(MainActivity.this).setTitle("地图暂时无法显示")
                    .setMessage("请重新打开应用。若反复出现，请更新 Android System WebView。")
                    .setPositiveButton("重新打开", (dialog, which) -> recreate())
                    .setNegativeButton("关闭", (dialog, which) -> finish()).show();
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                if (!isUserGesture) return false;
                // target="_blank" uses a separate transport. Never attach it to the app UI or expose the bridge.
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    private boolean opened;
                    private void handOff(String url) {
                        if (opened || "about:blank".equals(url)) return;
                        opened = true;
                        openExternal(Uri.parse(url));
                        popup.post(popup::destroy);
                    }
                    @Override public boolean shouldOverrideUrlLoading(WebView child, WebResourceRequest request) {
                        handOff(request.getUrl().toString());
                        return true;
                    }
                    @Override public void onPageStarted(WebView child, String url, android.graphics.Bitmap favicon) {
                        handOff(url);
                    }
                    @Override public boolean onRenderProcessGone(WebView child, RenderProcessGoneDetail detail) {
                        child.destroy();
                        return true;
                    }
                });
                ((WebView.WebViewTransport) resultMsg.obj).setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!(LinkPolicy.ORIGIN.equals(origin) || (LinkPolicy.ORIGIN + "/").equals(origin))) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                if (locationCallback != null) locationCallback.invoke(locationOrigin, false, false);
                locationCallback = callback;
                locationOrigin = origin;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_REQUEST);
            }
            @Override public void onGeolocationPermissionsHidePrompt() {
                locationCallback = null;
                locationOrigin = null;
            }
        });
        webView.addJavascriptInterface(new ClipboardBridge(), "WayfinderAndroid");
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        webView.loadUrl(LinkPolicy.HOME);
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == LOCATION_REQUEST && locationCallback != null) {
            locationCallback.invoke(locationOrigin, hasLocationPermission(), false);
            locationCallback = null;
            locationOrigin = null;
        }
    }

    private void openExternal(Uri uri) {
        if (!LinkPolicy.isExternal(uri.toString())) return;
        try {
            startActivity(new Intent("tel".equals(uri.getScheme()) ? Intent.ACTION_DIAL : Intent.ACTION_VIEW, uri));
        } catch (android.content.ActivityNotFoundException e) {
            Toast.makeText(this, "没有可打开此链接的应用", Toast.LENGTH_LONG).show();
        }
    }

    private void handleBack() {
        if (webView == null) { finish(); return; }
        webView.evaluateJavascript("Boolean(window.wayfinderBack && window.wayfinderBack())", handled -> {
            if (!"true".equals(handled)) moveTaskToBack(true);
        });
    }

    // API 33+ uses the OnBackInvokedDispatcher registered in onCreate; this is the older-device fallback.
    @SuppressLint("GestureBackNavigation")
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { handleBack(); }

    private final class ClipboardBridge {
        @JavascriptInterface public boolean copyRoute(String text) {
            if (text == null || text.length() > 4096 || !LinkPolicy.isPublicRoute(text)) return false;
            runOnUiThread(() -> {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                clipboard.setPrimaryClip(ClipData.newPlainText("中大寻路路线", text));
            });
            return true;
        }
    }

    @Override protected void onPause() { if (webView != null) webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        locationCallback = null;
        if (webView != null) { root.removeView(webView); webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
