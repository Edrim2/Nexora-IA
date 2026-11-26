export class OllamaProvider {
  constructor({ baseUrl = 'http://127.0.0.1:11434', model = '' } = {}) { this.name = 'ollama'; this.baseUrl = baseUrl.replace(/\/+$/, ''); this.model = model; }
  async generate(system, prompt) {
    if (!this.model) throw new Error('Configure um modelo Ollama com --model (ex.: qwen2.5-coder:7b).');
    const response = await fetch(`${this.baseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.model, stream: false, format: 'json', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }), signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Ollama respondeu HTTP ${response.status}.`);
    const data = await response.json();
    if (typeof data.message?.content !== 'string') throw new Error('Resposta inválida do Ollama.');
    return data.message.content;
  }
}

export class OpenAICompatibleProvider {
  constructor({ baseUrl, model = '', apiKey = '' } = {}) { this.name = 'openai-compatible'; this.baseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, ''); this.model = model; this.apiKey = apiKey; }
  async generate(system, prompt) {
    if (!this.model) throw new Error('Configure --model para o provedor OpenAI-compatible.');
    if (!this.apiKey && !/localhost|127\.0\.0\.1/.test(new URL(this.baseUrl).hostname)) throw new Error('Defina NEXORA_PROVIDER_API_KEY para o provedor remoto.');
    const response = await fetch(`${this.baseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) }, body: JSON.stringify({ model: this.model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }), signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Provedor compatível respondeu HTTP ${response.status}.`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new Error('Resposta inválida do provedor.');
    return text;
  }
}

export function createProvider({ kind = 'ollama', model = '', baseUrl = '' } = {}) {
  if (kind === 'ollama') return new OllamaProvider({ baseUrl: baseUrl || 'http://127.0.0.1:11434', model });
  if (kind === 'openai-compatible') return new OpenAICompatibleProvider({ baseUrl: baseUrl || process.env.NEXORA_PROVIDER_URL || 'https://api.openai.com/v1', model, apiKey: process.env.NEXORA_PROVIDER_API_KEY || '' });
  throw new Error('Provedor desconhecido. Opções: ollama, openai-compatible.');
}
