package io.picsa.extension;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  // required for capacitor-video-player
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    CastContext.getSharedInstance(this);
  }
}
