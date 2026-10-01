package io.github.collapsar11.cuhkwayfinder;

import java.net.URI;

/** Keep untrusted sites outside the WebView that exposes the clipboard bridge. */
final class LinkPolicy {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String HOME = ORIGIN + "/app/index.html";
    static boolean isLocal(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
                && uri.getUserInfo() == null && uri.getPort() == -1 && uri.getPath().startsWith("/app/");
        } catch (RuntimeException e) { return false; }
    }
    static boolean isPublicRoute(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equals(uri.getScheme()) && "collapsar11.github.io".equals(uri.getHost())
                && uri.getUserInfo() == null && uri.getPort() == -1 && "/cuhk-wayfinder/".equals(uri.getPath());
        } catch (RuntimeException e) { return false; }
    }
    static boolean isExternal(String value) {
        try {
            URI uri = URI.create(value);
            return (("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) && uri.getHost() != null)
                || "tel".equals(uri.getScheme());
        } catch (RuntimeException e) { return false; }
    }
}
