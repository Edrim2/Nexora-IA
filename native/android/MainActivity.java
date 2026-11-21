package br.com.edrim2.nexoraai;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(LocalAIPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
