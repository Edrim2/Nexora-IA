
package br.com.edrim2.nexoraai

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.JSObject

@CapacitorPlugin(name = "LocalAI")
class LocalAIPlugin : Plugin() {

    @PluginMethod
    fun getStatus(call: PluginCall) {
        val result = JSObject()

        result.put("available", false)
        result.put("engine", "LiteRT-LM")
        result.put("message", "Motor local aguardando configuração do modelo.")

        call.resolve(result)
    }
}
