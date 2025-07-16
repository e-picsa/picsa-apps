package io.picsa.extension;

import android.os.Bundle;
import android.util.Log;
import android.view.View;

import com.getcapacitor.BridgeActivity;

import androidx.annotation.Nullable;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    // Track how long app startup takes to adjust how long to keep splash screen displayed
    long START_TIME = System.currentTimeMillis();

    super.onCreate(savedInstanceState);
    final View content = findViewById(android.R.id.content);

    // Ensure splash is displayed for at least 800ms (default dismisses on first draw)
    long SPLASH_MIN_DURATION = 800;
    long END_TIME = System.currentTimeMillis();
    long TIME_ELAPSED = END_TIME - START_TIME;
    long SPLASH_DELAY = SPLASH_MIN_DURATION - TIME_ELAPSED;
    if(SPLASH_DELAY > 0){
      new SplashDelay().run(SPLASH_DELAY, content);
    }
  }
}
