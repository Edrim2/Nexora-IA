
package br.com.edrim2.nexoraai

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.JSObject
import org.json.JSONObject
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter
import java.util.concurrent.Executors

@CapacitorPlugin(name = "LocalAI")
class LocalAIPlugin : Plugin() {

    companion object {
        private const val SERVER = "http://127.0.0.1:9931"
        private val executor = Executors.newSingleThreadExecutor()
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        executor.execute {
            try {
                val connection = URL("$SERVER/health")
                    .openConnection() as HttpURLConnection

                connection.connectTimeout = 3000
                connection.readTimeout = 3000

                val available = connection.responseCode == 200
                connection.disconnect()

                val result = JSObject()
                result.put("available", available)
                result.put("engine", "llama.cpp")
                result.put(
                    "message",
                    if (available) "Servidor local conectado."
                    else "Servidor local indisponível."
                )

                call.resolve(result)

            } catch (error: Exception) {
                val result = JSObject()
                result.put("available", false)
                result.put("engine", "llama.cpp")
                result.put("message", error.message ?: "Falha de conexão.")
                call.resolve(result)
            }
        }
    }

    @PluginMethod
    fun generate(call: PluginCall) {
        val prompt = call.getString("prompt")?.trim().orEmpty()
        val history = call.getArray("history") ?: JSONArray()

        if (prompt.isEmpty()) {
            call.reject("A mensagem está vazia.")
            return
        }

        executor.execute {
            var connection: HttpURLConnection? = null

            try {
                val messages = JSONArray()

                for (i in 0 until history.length()) {
                    val item = history.optJSONObject(i) ?: continue
                    val role = item.optString("role")
                    val content = item.optString("content")

                    if (role in listOf("user", "assistant", "system")) {
                        messages.put(
                            JSONObject()
                                .put("role", role)
                                .put("content", content)
                        )
                    }
                }

                messages.put(
                    JSONObject()
                        .put("role", "user")
                        .put("content", prompt)
                )

                val body = JSONObject()
                    .put("messages", messages)
                    .put(
                        "chat_template_kwargs",
                        JSONObject().put("enable_thinking", false)
                    )
                    .put("max_tokens", 512)
                    .put("temperature", 0.7)

                connection = URL("$SERVER/v1/chat/completions")
                    .openConnection() as HttpURLConnection

                connection.connectTimeout = 10000
                connection.readTimeout = 180000
                connection.requestMethod = "POST"
                connection.doOutput = true

                connection.setRequestProperty(
                    "Content-Type",
                    "application/json"
                )

                OutputStreamWriter(
                    connection.outputStream,
                    Charsets.UTF_8
                ).use { writer ->
                    writer.write(body.toString())
                }

                val responseCode = connection.responseCode

                val stream = if (responseCode in 200..299) {
                    connection.inputStream
                } else {
                    connection.errorStream
                }

                val responseText = stream.bufferedReader().use {
                    it.readText()
                }

                if (responseCode !in 200..299) {
                    throw Exception(
                        "Servidor respondeu HTTP $responseCode: $responseText"
                    )
                }

                val response = JSONObject(responseText)

                val text = response
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .optString("content")
                    .trim()

                if (text.isEmpty()) {
                    throw Exception("O servidor retornou uma resposta vazia.")
                }

                val result = JSObject()
                result.put("text", text)
                result.put("provider", "local")
                result.put("model", "Qwen3 1.7B")

                call.resolve(result)

            } catch (error: Exception) {
                call.reject(
                    error.message ?: "Falha ao gerar resposta local."
                )
            } finally {
                connection?.disconnect()
            }
        }
    }
}
