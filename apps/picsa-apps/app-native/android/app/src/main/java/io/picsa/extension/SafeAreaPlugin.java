package io.picsa.extension;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

@CapacitorPlugin(name = "SafeArea")
public class SafeAreaPlugin extends Plugin {

    @PluginMethod
    public void getInsets(PluginCall call) {
        android.app.Activity activity = getActivity();
        if (activity == null) {
            JSObject ret = new JSObject();
            ret.put("top", 0);
            ret.put("bottom", 0);
            ret.put("left", 0);
            ret.put("right", 0);
            call.resolve(ret);
            return;
        }
        activity.runOnUiThread(() -> {
            JSObject ret = new JSObject();
            try {
                android.view.Window window = activity.getWindow();
                android.content.Context context = getContext();
                if (window == null || context == null) {
                    ret.put("top", 0);
                    ret.put("bottom", 0);
                    ret.put("left", 0);
                    ret.put("right", 0);
                    call.resolve(ret);
                    return;
                }
                float density = context.getResources().getDisplayMetrics().density;
                android.view.View decorView = window.getDecorView();
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
                
                int top = 0;
                int bottom = 0;
                int left = 0;
                int right = 0;
                
                if (insets != null) {
                    androidx.core.graphics.Insets systemBarInsets = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
                    top = (int) (systemBarInsets.top / density);
                    bottom = insets.isVisible(WindowInsetsCompat.Type.ime()) ? 0 : (int) (systemBarInsets.bottom / density);
                    left = (int) (systemBarInsets.left / density);
                    right = (int) (systemBarInsets.right / density);
                }
                
                ret.put("top", top);
                ret.put("bottom", bottom);
                ret.put("left", left);
                ret.put("right", right);
                call.resolve(ret);
            } catch (Exception e) {
                ret.put("top", 0);
                ret.put("bottom", 0);
                ret.put("left", 0);
                ret.put("right", 0);
                call.resolve(ret);
            }
        });
    }
}
