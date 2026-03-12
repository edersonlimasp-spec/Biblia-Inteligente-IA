package com.bibliainteligente.app;

import android.os.Bundle;
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
    }
}
