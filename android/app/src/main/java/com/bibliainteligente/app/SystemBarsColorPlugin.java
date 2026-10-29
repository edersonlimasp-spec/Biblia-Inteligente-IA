package com.bibliainteligente.app;

import android.app.Activity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Recebe do app web a cor do topo/rodapé da tela atual e pinta as barras do sistema. */
@CapacitorPlugin(name = "SystemBarsColor")
public class SystemBarsColorPlugin extends Plugin {

    @PluginMethod
    public void setColors(PluginCall call) {
        String top = call.getString("top", "#0A1420");
        String bottom = call.getString("bottom", top);
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).setBarColors(top, bottom);
        }
        call.resolve();
    }
}
