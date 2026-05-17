package io.picsa.extension;

import android.graphics.Color;
import android.os.Build;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class SafeAreaPolyfill {

    /**
     * Enforce true edge-to-edge layouts on all Android versions.
     * - Android 15+: Natively enforced by OS.
     * - Android <= 14: explicitly draws the app behind the system bars to match modern behavior.
     */
    public static void enableEdgeToEdge(BridgeActivity activity) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        activity.getWindow().setStatusBarColor(Color.TRANSPARENT);
        activity.getWindow().setNavigationBarColor(Color.TRANSPARENT);
    }

    /**
     * Polyfill safe area insets for Android < 15 since Capacitor 8 omits them.
     */
    public static void applyListener(BridgeActivity activity) {
        // Capacitor 8 handles CSS safe areas natively on modern environments.
        // However, on Android < 15, the SystemBars plugin does not inject --safe-area-inset-* variables.
        // This listener explicitly injects them for older Androids so the CSS fallback works universally.
        // NOTE: On Android 15+ with outdated WebViews (< v140), Capacitor will gracefully 
        // fall back to a letterboxed layout and inject 0px to prevent double padding.
        if (Build.VERSION.SDK_INT >= 35) return; // 35 = VANILLA_ICE_CREAM

        ViewCompat.setOnApplyWindowInsetsListener(activity.getWindow().getDecorView(), (v, insets) -> {
            if (activity.getBridge() != null && activity.getBridge().getWebView() != null) {
                float density = activity.getResources().getDisplayMetrics().density;
                int top = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).top / density);
                int bottom = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom / density);
                int left = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).left / density);
                int right = (int) (insets.getInsets(WindowInsetsCompat.Type.systemBars()).right / density);
                
                String script = String.format(
                    "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx');" +
                    "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx');" +
                    "document.documentElement.style.setProperty('--safe-area-inset-left', '%dpx');" +
                    "document.documentElement.style.setProperty('--safe-area-inset-right', '%dpx');",
                    top, bottom, left, right
                );
                activity.getBridge().getWebView().evaluateJavascript(script, null);
            }
            return ViewCompat.onApplyWindowInsets(v, insets);
        });
    }
}
