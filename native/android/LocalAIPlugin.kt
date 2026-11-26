
package br.com.edrim2.nexoraai

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.JSObject
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

@CapacitorPlugin(name = "LocalAI")
class LocalAIPlugin : Plugin() {

    private val serverBaseUrl = "http://127.0.0.1:9931"

    private fun request(
        path: String,
        method: String,
        body: String? = null
    ): String {
        val connection =
            URL(serverBaseUrl + path).openConnection() as HttpURLConnection

        connection.requestMethod = method
        connection.connectTimeout = 4000
        connection.readTimeout = 300000
        connection.setRequestProperty("Accept", "application/json")

        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use {
                it.write(body.toByteArray(Charsets.UTF_8))
            }
        }

        try {
            val status = connection.responseCode
            val stream =
                if (status in 200..299) connection.inputStream
                else connection.errorStream

            val response =
                stream?.bufferedReader()?.use { it.readText() } ?: ""

            if (status !in 200..299) {
                throw IllegalStateException(
                    "Servidor local respondeu HTTP $status: $response"
                )
            }

            return response
        } finally {
            connection.disconnect()
        }
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        Thread {
            try {
                request("/health", "GET")

                val result = JSObject()
                result.put("available", true)
                result.put("engine", "llama.cpp")
                result.put("message", "Servidor local conectado.")

                call.resolve(result)
            } catch (error: Exception) {
                val result = JSObject()
                result.put("available", false)
                result.put("engine", "llama.cpp")
                result.put(
                    "message",
                    error.message ?: "Servidor local indisponível."
                )

                call.resolve(result)
            }
        }.start()
    }

    @PluginMethod
    fun generate(call: PluginCall) {
        val payload = call.getString("payload")

        if (payload.isNullOrBlank()) {
            call.reject("O conteúdo da solicitação está vazio.")
            return
        }

        Thread {
            try {
                val response = request(
                    "/v1/chat/completions",
                    "POST",
                    payload
                )

                val root = JSONObject(response)
                val choices = root.getJSONArray("choices")

                if (choices.length() == 0) {
                    throw IllegalStateException(
                        "O modelo não retornou uma resposta."
                    )
                }

                val message =
                    choices.getJSONObject(0).getJSONObject("message")

                val generatedText =
                    message.optString("content", "").trim()

                if (generatedText.isEmpty()) {
                    throw IllegalStateException(
                        "O modelo retornou uma resposta vazia."
                    )
                }

                val result = JSObject()
                result.put("text", generatedText)
                result.put(
                    "model",
                    root.optString("model", "Qwen3 local")
                )

                call.resolve(result)
            } catch (error: Exception) {
                call.reject(
                    error.message ?: "Falha ao consultar o motor local."
                )
            }
        }.start()
    }
}
