# PICSA release shrinking rules (issue #916).
# R8 full mode is enabled for release builds (minifyEnabled + shrinkResources).
# Capacitor loads plugins via reflection (annotations + Bridge), so everything
# the Bridge touches at runtime must be kept explicitly.

# Keep line numbers for Crashlytics deobfuscation (mapping upload enabled in build.gradle).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- OkHttp optional Conscrypt dependency (loaded reflectively only when present) ---
-dontwarn org.conscrypt.Conscrypt
-dontwarn org.conscrypt.OpenSSLProvider

# --- App entry points ---
-keep class io.picsa.extension.** { *; }

# --- Capacitor core (reflection via BridgeActivity/Plugin annotations) ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclasseswithmembernames class * {
    @com.getcapacitor.PluginMethod *;
}
-keepclasseswithmembernames class * {
    @com.getcapacitor.annotation.Permission *;
}
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray { *; }
-keep class com.getcapacitor.PluginResult { *; }
-keep class com.getcapacitor.PluginCall { *; }

# --- Cordova compatibility layer (file, file-opener2, socialsharing) ---
-keep class org.apache.cordova.** { *; }
-keep class org.apache.cordova.CordovaPlugin { *; }

# --- Firebase (Crashlytics + Analytics kept live; Performance removed) ---
-keep class com.google.firebase.crashlytics.** { *; }
-keep class com.google.firebase.analytics.** { *; }
-dontwarn com.google.firebase.**
# Crashlytics custom keys / log calls are reflectively resolved in some paths.
-keepattributes *Annotation*

# --- Capacitor plugins with native code ---
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.capacitorcommunity.** { *; }
-keep class io.capawesome.** { *; }
-keep class com.jeep.plugin.capacitor.** { *; }
-keep class com.equimaps.** { *; }

# --- androidx.media3 (capacitor-video-player: exoplayer, hls/dash, session, cast) ---
# Player components are inflated/instantiated reflectively; keep all media3.
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
# ExoPlayer DefaultRenderersFactory loads renderers by name via reflection.
-keep class androidx.media3.exoplayer.video.** { *; }
-keep class androidx.media3.exoplayer.audio.** { *; }
-keep class androidx.media3.exoplayer.text.** { *; }
-keep class androidx.media3.exoplayer.metadata.** { *; }

# --- Cast SDK (required by capacitor-video-player; removal tracked separately) ---
-keep class com.google.android.gms.cast.** { *; }
-keep class androidx.mediarouter.** { *; }

# --- Push notifications (FCM) ---
-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.messaging.**

# --- FileProvider / sharing / opening (reflective manifest lookups) ---
-keep class androidx.core.content.FileProvider { *; }

# --- WebView bridges ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Serialization used by plugins / config payloads ---
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
-keepnames class * implements java.io.Serializable

# --- Native methods + enums (obfuscation breaks both) ---
-keepclasseswithmembernames class * {
    native <methods>;
}
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# --- Sentry (live; consolidation is a separate decision) ---
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**
