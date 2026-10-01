package io.github.collapsar11.cuhkwayfinder;

import org.junit.Test;
import static org.junit.Assert.*;

public class LinkPolicyTest {
    @Test public void onlyBundledOriginCanStayInApp() {
        assertTrue(LinkPolicy.isLocal(LinkPolicy.HOME));
        assertFalse(LinkPolicy.isLocal("https://appassets.androidplatform.net.evil.test/app/"));
        assertFalse(LinkPolicy.isLocal("https://evil.test@appassets.androidplatform.net/app/"));
        assertFalse(LinkPolicy.isLocal("file:///data/local/tmp/page.html"));
        assertFalse(LinkPolicy.isLocal("https://appassets.androidplatform.net/other/"));
    }
    @Test public void copiedRoutesAreUsablePublicLinks() {
        assertTrue(LinkPolicy.isPublicRoute("https://collapsar11.github.io/cuhk-wayfinder/?from=b-109&to=entrance-shb-5"));
        assertFalse(LinkPolicy.isPublicRoute(LinkPolicy.HOME));
        assertFalse(LinkPolicy.isPublicRoute("https://collapsar11.github.io.evil.test/cuhk-wayfinder/"));
    }
    @Test public void externalHandlersRejectExecutableAndPrivateSchemes() {
        assertTrue(LinkPolicy.isExternal("https://www.google.com/maps/dir/?api=1"));
        assertTrue(LinkPolicy.isExternal("tel:39430000"));
        assertFalse(LinkPolicy.isExternal("javascript:alert(1)"));
        assertFalse(LinkPolicy.isExternal("intent://scan/#Intent;scheme=zxing;end"));
        assertFalse(LinkPolicy.isExternal("file:///sdcard/test.html"));
    }
}
