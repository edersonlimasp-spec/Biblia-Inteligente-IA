package com.bibliainteligente.app;

import android.os.Bundle;
import android.webkit.WebSettings;
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
}
