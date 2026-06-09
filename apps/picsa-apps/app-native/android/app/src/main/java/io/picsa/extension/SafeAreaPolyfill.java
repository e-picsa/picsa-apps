package io.picsa.extension;

import android.graphics.Color;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class SafeAreaPolyfill {

    /**
     * Enforce true edge-to-edge layouts on all Android versions.
     * - Android 15+: Natively enforced by OS (requires postSplashScreenTheme to be unlocked).
     * - Android <= 14: explicitly draws the app behind the system bars to match modern behavior.
     */
    public static void enableEdgeToEdge(BridgeActivity activity) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        activity.getWindow().setStatusBarColor(Color.TRANSPARENT);
        activity.getWindow().setNavigationBarColor(Color.TRANSPARENT);

        // NOTE: We control the status/navigation bar icon styles natively here instead of using the
        // Capacitor SystemBars plugin configuration. Doing this programmatically provides 100% native control, 
        // bypasses plugin loading order bugs (which can override custom layouts), and ensures that status bar
        // icons remain white (light) on our dark primary header background, regardless of device system theme.
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(activity.getWindow(), activity.getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false); // false = light icons for dark backgrounds
            controller.setAppearanceLightNavigationBars(false);
        }
    }

    /**
     * Intercept system bar insets and inject CSS custom properties to allow custom layouts
     * to pad themselves safely, while disabling Capacitor's default native parent padding.
     */
    public static void applyListener(BridgeActivity activity) {
        // We bind the window insets listener directly to the WebView's parent container
        // to overwrite Capacitor's default SystemBars listener and return CONSUMED to
        // stop Capacitor from enforcing native layout margins/padding on the WebView.
        // This allows true full-screen overlay layouts, with safety variables supplied via CSS.

        if (activity.getBridge() == null || activity.getBridge().getWebView() == null) {
            return;
        }

        android.view.View webView = activity.getBridge().getWebView();
        android.view.ViewParent parent = webView.getParent();
        android.view.View parentView = parent instanceof android.view.View ? (android.view.View) parent : null;

        ViewCompat.setOnApplyWindowInsetsListener(parentView != null ? parentView : webView, (v, insets) -> {
            float density = activity.getResources().getDisplayMetrics().density;
            androidx.core.graphics.Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            int top = (int) (systemBars.top / density);
            int bottom = insets.isVisible(WindowInsetsCompat.Type.ime()) ? 0 : (int) (systemBars.bottom / density);
            int left = (int) (systemBars.left / density);
            int right = (int) (systemBars.right / density);
            
            // Force WebView and its parent view to occupy full screen bounds with zero padding/margins,
            // only setting them if they are not already zero to prevent redundant layout requests.
            if (webView.getPaddingLeft() != 0 || webView.getPaddingTop() != 0 || webView.getPaddingRight() != 0 || webView.getPaddingBottom() != 0) {
                webView.setPadding(0, 0, 0, 0);
            }
            if (v.getPaddingLeft() != 0 || v.getPaddingTop() != 0 || v.getPaddingRight() != 0 || v.getPaddingBottom() != 0) {
                v.setPadding(0, 0, 0, 0);
            }
            if (webView.getLayoutParams() instanceof android.view.ViewGroup.MarginLayoutParams) {
                android.view.ViewGroup.MarginLayoutParams lp = (android.view.ViewGroup.MarginLayoutParams) webView.getLayoutParams();
                if (lp.leftMargin != 0 || lp.topMargin != 0 || lp.rightMargin != 0 || lp.bottomMargin != 0) {
                    lp.setMargins(0, 0, 0, 0);
                    webView.setLayoutParams(lp);
                }
            }
            
            String script = String.format(
                java.util.Locale.US,
                "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-left', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-right', '%dpx');",
                top, bottom, left, right
            );
            if (activity.getBridge() != null && activity.getBridge().getWebView() != null) {
                activity.getBridge().getWebView().evaluateJavascript(script, null);
            }
            
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
