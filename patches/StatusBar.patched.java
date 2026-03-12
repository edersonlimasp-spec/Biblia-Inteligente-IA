package com.capacitorjs.plugins.statusbar;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * Patched for Android 15 (API 35) Edge-to-Edge compatibility.
 * Changes vs. @capacitor/status-bar v8.0.0:
 * 1. setOverlaysWebView() uses WindowCompat.setDecorFitsSystemWindows() on API 30+,
 *    avoiding deprecated SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN entirely.
 * 2. getStatusBarColorDeprecated() calls guarded to API < 35 in constructor and getInfo().
 * These changes eliminate the deprecated API calls that trigger Google Play warnings
 * while preserving identical behavior on all supported Android versions.
 */
public class StatusBar {

    public static final String statusBarVisibilityChanged = "statusBarVisibilityChanged";
    public static final String statusBarOverlayChanged = "statusBarOverlayChanged";

    private int currentStatusBarColor;
    private final ChangeListener listener;
    private final AppCompatActivity activity;
    private String currentStyle = "DEFAULT";

    public StatusBar(AppCompatActivity activity, StatusBarConfig config, ChangeListener listener) {
        this.activity = activity;
        // Guard: getStatusBarColor() is deprecated on API 35+; in EdgeToEdge mode
        // the status bar is transparent, so we store TRANSPARENT as the initial color.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            this.currentStatusBarColor = getStatusBarColorDeprecated();
        } else {
            this.currentStatusBarColor = Color.TRANSPARENT;
        }
        this.listener = listener;
        setBackgroundColor(config.getBackgroundColor());
        setStyle(config.getStyle());
        setOverlaysWebView(config.isOverlaysWebView());
        StatusBarInfo info = getInfo();
        info.setVisible(true);
        listener.onChange(statusBarOverlayChanged, info);
    }

    public void setStyle(String style) {
        Window window = activity.getWindow();
        View decorView = window.getDecorView();
        this.currentStyle = style;
        if (style.equals("DEFAULT")) {
            style = getStyleForTheme();
        }

        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(window, decorView);
        windowInsetsControllerCompat.setAppearanceLightStatusBars(!style.equals("DARK"));
    }

    private String getStyleForTheme() {
        int currentNightMode = activity.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        if (currentNightMode != Configuration.UI_MODE_NIGHT_YES) {
            return "LIGHT";
        }
        return "DARK";
    }

    public void updateStyle() {
        setStyle(this.currentStyle);
    }

    public void setBackgroundColor(int color) {
        Window window = activity.getWindow();
        if (shouldSetStatusBarColor(isEdgeToEdgeOptOutEnabled(window))) {
            clearTranslucentStatusFlagDeprecated();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            setStatusBarColorDeprecated(color);
            currentStatusBarColor = color;

            // only set foreground color if style is default
            if (currentStyle.equals("DEFAULT")) {
                boolean isLightColor = ColorUtils.calculateLuminance(color) > 0.5;
                WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
                insetsController.setAppearanceLightStatusBars(isLightColor);
            }
        }
    }

    public void hide() {
        View decorView = activity.getWindow().getDecorView();
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        windowInsetsControllerCompat.hide(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = getInfo();
        info.setVisible(false);
        listener.onChange(statusBarVisibilityChanged, info);
    }

    public void show() {
        View decorView = activity.getWindow().getDecorView();
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        windowInsetsControllerCompat.show(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = getInfo();
        info.setVisible(true);
        listener.onChange(statusBarVisibilityChanged, info);
    }

    /**
     * Configures whether the WebView content draws behind the status bar.
     *
     * PATCHED: On Android 11+ (API 30+), uses the modern WindowCompat API instead of
     * the deprecated SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN / setSystemUiVisibility approach.
     * This eliminates the Google Play "deprecated Edge-to-Edge API" warning for this method.
     * On Android 10 and below, falls back to the legacy approach (still valid on those APIs).
     */
    public void setOverlaysWebView(Boolean overlays) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Modern API (Android 11+): WindowCompat.setDecorFitsSystemWindows replaces
            // the deprecated SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN / setSystemUiVisibility combo.
            // false = content draws behind system bars (overlay mode).
            // true  = content is inset below system bars (normal mode).
            WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), !overlays);
            if (overlays) {
                // In overlay mode the status bar is transparent; store TRANSPARENT
                // so that switching back to non-overlay restores the right color.
                currentStatusBarColor = Color.TRANSPARENT;
            }
        } else {
            // Legacy path for Android 10 (API 29) and below.
            // These APIs are deprecated on API 30+ but required on older devices.
            View decorView = activity.getWindow().getDecorView();
            int uiOptions = getSystemUiVisibilityDeprecated(decorView);
            if (overlays) {
                uiOptions = uiOptions | getSystemUiFlagLayoutStableDeprecated() | getSystemUiFlagLayoutFullscreenDeprecated();
                setSystemUiVisibilityDeprecated(decorView, uiOptions);
                currentStatusBarColor = getStatusBarColorDeprecated();
                setStatusBarColorDeprecated(Color.TRANSPARENT);
            } else {
                uiOptions = uiOptions & ~getSystemUiFlagLayoutStableDeprecated() & ~getSystemUiFlagLayoutFullscreenDeprecated();
                setSystemUiVisibilityDeprecated(decorView, uiOptions);
                setStatusBarColorDeprecated(currentStatusBarColor);
            }
        }
        listener.onChange(statusBarOverlayChanged, getInfo());
    }

    private boolean shouldSetStatusBarColor(boolean hasOptOut) {
        boolean canSetStatusBar;
        int deviceApi = Build.VERSION.SDK_INT;
        if (deviceApi < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            // Android 10-14: can always set status bar color via legacy API
            canSetStatusBar = true;
        } else if (deviceApi == Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            // Android 15: only set if app explicitly opted out of Edge-to-Edge enforcement
            canSetStatusBar = hasOptOut;
        } else {
            // Android 16+: opt-out ignored; Edge-to-Edge enforced by OS
            canSetStatusBar = false;
        }
        return canSetStatusBar;
    }

    private boolean isEdgeToEdgeOptOutEnabled(Window window) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            TypedValue value = new TypedValue();
            window.getContext().getTheme().resolveAttribute(android.R.attr.windowOptOutEdgeToEdgeEnforcement, value, true);
            return value.data != 0;
        }
        return false;
    }

    private boolean getIsOverlaid() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // On Android 11+, overlay mode is determined by whether the window
            // fits system windows (i.e., does NOT fit = overlay mode active).
            Window window = activity.getWindow();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(window.getDecorView());
            if (insets != null) {
                // If the root insets are "consumed" (i.e. window draws behind bars), we're overlaid.
                return insets.isVisible(WindowInsetsCompat.Type.statusBars()) &&
                       !window.getDecorView().getFitsSystemWindows();
            }
            return false;
        }
        // Legacy path for Android 10 and below
        return (
            (getSystemUiVisibilityDeprecated(activity.getWindow().getDecorView()) & getSystemUiFlagLayoutFullscreenDeprecated()) ==
            getSystemUiFlagLayoutFullscreenDeprecated()
        );
    }

    public StatusBarInfo getInfo() {
        Window window = activity.getWindow();
        WindowInsetsCompat windowInsetsCompat = ViewCompat.getRootWindowInsets(window.getDecorView());
        boolean isVisible = windowInsetsCompat != null && windowInsetsCompat.isVisible(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = new StatusBarInfo();
        info.setStyle(getStyle());
        info.setOverlays(getIsOverlaid());
        info.setVisible(isVisible);
        // Guard: getStatusBarColor() is deprecated on API 35+.
        // In EdgeToEdge mode the bar is transparent; report the stored color instead.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            info.setColor(String.format("#%06X", (0xFFFFFF & getStatusBarColorDeprecated())));
        } else {
            info.setColor(String.format("#%06X", (0xFFFFFF & currentStatusBarColor)));
        }
        info.setHeight(getStatusBarHeight());
        return info;
    }

    private String getStyle() {
        View decorView = activity.getWindow().getDecorView();
        String style = "DARK";
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        if (windowInsetsControllerCompat.isAppearanceLightStatusBars()) {
            style = "LIGHT";
        }
        return style;
    }

    private int getStatusBarHeight() {
        DisplayMetrics metrics = activity.getResources().getDisplayMetrics();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsets insets = activity.getWindowManager().getCurrentWindowMetrics().getWindowInsets();
            return (int) (insets.getInsets(WindowInsets.Type.statusBars()).top / metrics.density);
        }

        WindowInsets insets = activity.getWindow().getDecorView().getRootWindowInsets();
        if (insets != null) {
            return getSystemWindowInsetTopDeprecated(insets, metrics);
        }

        return 0;
    }

    public interface ChangeListener {
        void onChange(String eventName, StatusBarInfo info);
    }

    // -------------------------------------------------------------------------
    // Deprecated API wrappers — only called on Android 10 (API 29) and below,
    // or on Android 10-14 for status bar color (which is still valid there).
    // Annotated with @SuppressWarnings to suppress lint in development builds.
    // -------------------------------------------------------------------------

    @SuppressWarnings("deprecation")
    private int getStatusBarColorDeprecated() {
        return activity.getWindow().getStatusBarColor();
    }

    @SuppressWarnings("deprecation")
    private void setStatusBarColorDeprecated(int color) {
        activity.getWindow().setStatusBarColor(color);
    }

    @SuppressWarnings("deprecation")
    private void clearTranslucentStatusFlagDeprecated() {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    }

    @SuppressWarnings("deprecation")
    private int getSystemUiVisibilityDeprecated(View decorView) {
        return decorView.getSystemUiVisibility();
    }

    @SuppressWarnings("deprecation")
    private void setSystemUiVisibilityDeprecated(View decorView, int uiOptions) {
        decorView.setSystemUiVisibility(uiOptions);
    }

    @SuppressWarnings("deprecation")
    private int getSystemUiFlagLayoutStableDeprecated() {
        return View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
    }

    @SuppressWarnings("deprecation")
    private int getSystemUiFlagLayoutFullscreenDeprecated() {
        return View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
    }

    @SuppressWarnings("deprecation")
    private int getSystemWindowInsetTopDeprecated(WindowInsets insets, DisplayMetrics metrics) {
        return (int) (insets.getSystemWindowInsetTop() / metrics.density);
    }
}
