package com.bibliainteligente.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewParent;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Barras do sistema (status bar / navegação) — solução definitiva da "faixa preta".
 *
 * Antes: o WebView desenhava atrás da status bar e cada tela web somava o recuo
 * (safe-area) por conta própria. Em vários aparelhos Android o recuo vinha em
 * dobro ou com valor errado, gerando uma faixa preta abaixo da status bar.
 *
 * Agora o recuo é feito UMA vez, aqui no nativo: o container do WebView recebe
 * padding igual às barras do sistema (e ao teclado), e o WebView recebe recuo zero.
 * A cor dessa área acompanha automaticamente a cor do topo/rodapé da tela aberta
 * (claro ou escuro), enviada pelo JavaScript via plugin local "SystemBarsColor".
 * Funciona do Android 7 ao 16 (edge-to-edge obrigatório no targetSdk 35/36).
 */
public class MainActivity extends BridgeActivity {

    private static final int DEFAULT_COLOR = Color.parseColor("#0A1420");
    private int topColor = DEFAULT_COLOR;
    private int bottomColor = DEFAULT_COLOR;
    private View barsContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SystemBarsColorPlugin.class);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel melChannel = new NotificationChannel(
                getString(R.string.mel_reminders_channel_id),
                getString(R.string.mel_reminders_channel_name),
                NotificationManager.IMPORTANCE_DEFAULT
            );
            notificationManager.createNotificationChannel(melChannel);
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setTextZoom(100);
            setupSystemBars(webView);
        }
    }

    private void setupSystemBars(WebView webView) {
        // Sem véu/escurecimento automático sobre as barras: a cor vem do app.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        ViewParent parent = webView.getParent();
        if (!(parent instanceof View)) return;
        final View container = (View) parent;
        applyColors(container);

        ViewCompat.setOnApplyWindowInsetsListener(container, (v, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            // O WebView não recebe recuo: o conteúdo web não precisa (nem deve) somar safe-area.
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(container);
        barsContainer = container;
    }

    private void applyColors(View container) {
        GradientDrawable bg = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[] { topColor, topColor, bottomColor, bottomColor });
        container.setBackground(bg);
        getWindow().getDecorView().setBackgroundColor(topColor);

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(isLight(topColor));
        controller.setAppearanceLightNavigationBars(isLight(bottomColor));
    }

    private static boolean isLight(int color) {
        double l = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255.0;
        return l > 0.6;
    }

    /** Chamado pelo plugin SystemBarsColor (JS) com a cor do topo e do rodapé da tela atual. */
    public void setBarColors(String top, String bottom) {
        final int t;
        final int b;
        try {
            t = Color.parseColor(top);
            b = Color.parseColor(bottom);
        } catch (Exception e) {
            return;
        }
        runOnUiThread(() -> {
            if (barsContainer == null || (t == topColor && b == bottomColor)) return;
            topColor = t;
            bottomColor = b;
            applyColors(barsContainer);
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && this.bridge != null) {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.requestLayout();
                webView.invalidate();
            }
        }
    }
}
