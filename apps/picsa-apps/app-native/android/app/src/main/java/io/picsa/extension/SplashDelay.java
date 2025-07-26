package io.picsa.extension;

import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.ViewTreeObserver;

/**
 * Delay the splash screen dismiss for a fixed period of time
 *
 * Adapted from
 * https://stackoverflow.com/a/76099488
 * https://developer.android.com/develop/ui/views/launch/splash-screen#suspend-drawing
 * https://github.com/ionic-team/capacitor-plugins/blob/main/splash-screen/android/src/main/java/com/capacitorjs/plugins/splashscreen/SplashScreen.java
 *
 * Could potentially be replaced by integrating more closely with capacitor splashscreen plugin
 * although unclear whether different assets for android 31+ supported
 */
public class SplashDelay  {

  private boolean isVisible = false;
  private ViewTreeObserver.OnPreDrawListener onPreDrawListener;

  public void run(long DELAY, View content) {
    // Set up an OnPreDrawListener to the root view.
    this.onPreDrawListener =  new ViewTreeObserver.OnPreDrawListener() {
      @Override
      public boolean onPreDraw() {
        // Start Timer On First Run
        if (!isVisible) {
          isVisible = true;

          new Handler().postDelayed(() -> {
              // Splash screen is done... start drawing content.
              isVisible = false;
              content.getViewTreeObserver().removeOnPreDrawListener(this);
            },
            DELAY
          );
        }
        // Not ready to dismiss splash screen
        return false;
      }
    };

    content.getViewTreeObserver().addOnPreDrawListener(this.onPreDrawListener);
  }

}
