package io.picsa.extension;

import android.graphics.Color;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
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
        android.view.View parentView = (android.view.View) webView.getParent();

        ViewCompat.setOnApplyWindowInsetsListener(parentView != null ? parentView : webView, (v, insets) -> {
            float density = activity.getResources().getDisplayMetrics().density;
            int top = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).top / density);
            int bottom = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom / density);
            int left = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).left / density);
            int right = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).right / density);
            
            // Force WebView and its parent view to occupy full screen bounds with zero padding/margins
            webView.setPadding(0, 0, 0, 0);
            v.setPadding(0, 0, 0, 0);
            if (webView.getLayoutParams() instanceof android.view.ViewGroup.MarginLayoutParams) {
                android.view.ViewGroup.MarginLayoutParams lp = (android.view.ViewGroup.MarginLayoutParams) webView.getLayoutParams();
                lp.setMargins(0, 0, 0, 0);
                webView.setLayoutParams(lp);
            }
            
            String script = String.format(
                "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-left', '%dpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-right', '%dpx');",
                top, bottom, left, right
            );
            webView.post(() -> {
                if (activity.getBridge() != null && activity.getBridge().getWebView() != null) {
                    activity.getBridge().getWebView().evaluateJavascript(script, null);
                }
            });
            
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
