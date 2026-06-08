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
        JSObject ret = new JSObject();
        try {
            float density = getContext().getResources().getDisplayMetrics().density;
            android.view.View decorView = getActivity().getWindow().getDecorView();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
            
            int top = 0;
            int bottom = 0;
            int left = 0;
            int right = 0;
            
            if (insets != null) {
                androidx.core.graphics.Insets systemBarInsets = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                top = (int) (systemBarInsets.top / density);
                bottom = (int) (systemBarInsets.bottom / density);
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
    }
}
