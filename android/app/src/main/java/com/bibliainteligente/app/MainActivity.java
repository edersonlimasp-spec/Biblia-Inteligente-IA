package com.bibliainteligente.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ativa Edge-to-Edge para Android 15 (API 35).
        // O conteúdo web trata os recuos via CSS env(safe-area-inset-*).
        EdgeToEdge.enable(this);
    }
}
