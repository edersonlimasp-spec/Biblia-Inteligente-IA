package com.bibliainteligente.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // IMPORTANTE: EdgeToEdge.enable() deve ser chamado ANTES de super.onCreate()
        // para que esteja ativo quando os plugins do Capacitor (StatusBar etc.) inicializam.
        // Isso garante que shouldSetStatusBarColor() retorne false no Android 15,
        // evitando chamadas às APIs descontinuadas setStatusBarColor/getStatusBarColor.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        // Trava o zoom de texto do WebView em 100%, ignorando a configuração de
        // "Tamanho da fonte" do sistema Android (Acessibilidade). Sem isso, usuários
        // com fonte grande/enorme no Android viam o app com tipografia gigante e layout
        // quebrado, sem como reduzir dentro do app.
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            settings.setTextZoom(100);
        }
    }

    /**
     * Fix: faixa branca após fechar o Google Play Billing bottom sheet.
     *
     * Quando o bottom sheet do Google Play Billing é exibido, o Android comprime
     * o WebView verticalmente (resize do viewport). Ao fechar o sheet, o sistema
     * não restaura automaticamente a altura do WebView — resultado: faixa branca
     * na parte inferior do app até o próximo redraw.
     *
     * Solução: ao recuperar o foco da janela (hasFocus=true), forçamos o WebView
     * a recalcular seu layout (requestLayout) e redesenhar (invalidate).
     * Isso ocorre sempre que qualquer overlay nativo fecha, incluindo o billing sheet.
     */
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
