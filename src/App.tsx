
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp, BrainCircuit, Bot, Code2, Compass, Cpu, Menu,
  MessageSquare, Plus, Search, Settings2, Sparkles, Wrench, X
} from "lucide-react";

import { HybridEngine } from "./ai/HybridEngine";
import { LocalEngine } from "./ai/LocalEngine";
import type { ChatMessage } from "./ai/types";

import { nexoraRuntime } from "./runtime/Runtime";
import type { CompatibilityResult } from "./compatibility/CompatibilityTypes";
import type { DeviceInfo, AppStorageInfo } from "./services/DeviceService";

type Section = "chat" | "studio" | "research" | "tools";

const sections: { id: Section; label: string; icon: typeof Bot }[] = [
  { id: "chat", label: "Conversar", icon: MessageSquare },
  { id: "studio", label: "Studio", icon: Code2 },
  { id: "research", label: "Pesquisa", icon: Compass },
  { id: "tools", label: "Ferramentas", icon: Wrench }
];

const coreUrl = import.meta.env.VITE_NEXORA_CORE_URL ?? "";

const engine = new HybridEngine({
  cloud: new CloudEngine({ baseUrl: coreUrl }),
  mode: "cloud"
});

export default function App() {
  const [section, setSection] = useState<Section>("chat");
  const [drawer, setDrawer] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cloudConfigured, setCloudConfigured] = useState(false);

  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [appStorage, setAppStorage] = useState<AppStorageInfo | null>(null);
  const [compatibility, setCompatibility] =
    useState<CompatibilityResult | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  const title =
    sections.find(item => item.id === section)?.label ?? "Conversar";

  useEffect(() => {
    let active = true;

    async function initializeRuntime() {
      try {
        const status = await nexoraRuntime.initialize();

        if (!active) return;

        if (status.state !== "ready") {
          setRuntimeError(status.error ?? "Runtime indisponível.");
          return;
        }

        setRuntimeReady(true);

        const info = nexoraRuntime.device.getInfo();
        setDeviceInfo(info);

        const storage = await nexoraRuntime.getAppStorageInfo();

        if (!active) return;

        setAppStorage(storage);

        const result = await nexoraRuntime.evaluateCompatibility({
          id: "nexora-base",
          name: "NEXORA Base",
          platforms: ["android", "ios", "web"],
          minLogicalCores: 2
        });

        if (active) setCompatibility(result);
      } catch (err) {
        if (active) {
          setRuntimeError(
            err instanceof Error
              ? err.message
              : "Falha ao inicializar o NEXORA Core."
          );
        }
      }
    }

    initializeRuntime();

    engine.getStatus().then(status => {
      if (active) setCloudConfigured(status.cloud);
    }).catch(() => {
      if (active) setCloudConfigured(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const content = prompt.trim();

    if (!content || loading) return;

    const history = [...messages];

    setMessages(previous => [
      ...previous,
      { role: "user", content }
    ]);

    setPrompt("");
    setError("");
    setLoading(true);

    try {
      const result = await engine.generate(content, history);

      setMessages(previous => [
        ...previous,
        {
          role: "assistant",
          content: result.text
        }
      ]);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Não foi possível conectar ao motor de IA.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    if (loading) return;

    setMessages([]);
    setPrompt("");
    setError("");
    setSection("chat");
    setDrawer(false);
  }

  function formatGB(value: number | null | undefined): string {
    if (value === null || value === undefined) return "Não identificado";
    return `${value.toFixed(2)} GB`;
  }

  return (
    <div className="app">
      {drawer && (
        <button
          className="scrim"
          aria-label="Fechar menu"
          onClick={() => setDrawer(false)}
        />
      )}

      <aside className={`sidebar ${drawer ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BrainCircuit size={23} />
          </div>

          <div>
            <b>NEXORA</b>
            <small>INTELLIGENCE STUDIO</small>
          </div>

          <button
            className="close-menu"
            onClick={() => setDrawer(false)}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={18} /> Nova conversa
        </button>

        <div className="section-label">ESPAÇO DE TRABALHO</div>

        <nav>
          {sections.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  section === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setSection(item.id);
                  setDrawer(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id !== "chat" && <small>EM BREVE</small>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className="engine-icon">
              <Cpu size={18} />
            </div>

            <div>
              <b>Motor de IA</b>
              <small>
                {cloudConfigured
                  ? "Servidor configurado"
                  : "Aguardando servidor"}
              </small>
            </div>

            <i />
          </div>

          <button
            className="nav-item settings"
            onClick={() => alert(
              "As configurações do motor serão adicionadas na próxima etapa."
            )}
          >
            <Settings2 size={18} />
            <span>Configurações</span>
          </button>

          <div className="version">
            NEXORA AI
            <span>ANDROID · v0.1.0</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
          >
            <Menu size={21} />
          </button>

          <div className="page-title">{title}</div>

          <div className="top-status">
            <i />
            <span>Prévia</span>
          </div>
        </header>

        <section className={`content ${
          section === "chat" && messages.length > 0
            ? "has-messages"
            : ""
        }`}>
          {section === "chat" && messages.length > 0 ? (
            <div className="chat-thread">
              <div className="chat-messages" aria-live="polite">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message-row ${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "assistant"
                        ? <BrainCircuit size={17} />
                        : <Bot size={17} />}
                    </div>

                    <div className="message-bubble">
                      <div className="message-meta">
                        {message.role === "assistant"
                          ? "NEXORA"
                          : "VOCÊ"}
                      </div>
                      <div className="message-text">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="message-row assistant">
                    <div className="message-avatar">
                      <BrainCircuit size={17} />
                    </div>

                    <div className="message-bubble">
                      <div className="message-meta">NEXORA</div>
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>
          ) : (
            <div className="welcome">
              <div className="eyebrow">
                <Sparkles size={13} />
                SEU ESPAÇO DE CRIAÇÃO
              </div>

              <div className="hero-icon">
                <BrainCircuit size={36} />
              </div>

              <h1>
                O próximo passo
                <br />
                <span>começa com uma ideia.</span>
              </h1>

              <p>
                A NEXORA está tomando forma. Um espaço para pensar,
                investigar e transformar ideias em projetos.
              </p>

              <div className="cards">
                <button onClick={() => setSection("studio")}>
                  <Code2 />
                  <b>Criar um projeto</b>
                  <small>Transforme uma ideia em software</small>
                </button>

                <button onClick={() => setSection("research")}>
                  <Search />
                  <b>Investigar</b>
                  <small>Organize perguntas e evidências</small>
                </button>

                <button onClick={() => setSection("tools")}>
                  <BrainCircuit />
                  <b>Explorar ferramentas</b>
                  <small>Conheça os módulos da NEXORA</small>
                </button>
              </div>

              {section === "tools" ? (
                <div className="module-note">
                  <Cpu size={20} />
                  <div>
                    <b>NEXORA Core · Diagnóstico do dispositivo</b>

                    <span>
                      Runtime: {runtimeReady ? "Inicializado" : "Aguardando"}
                    </span>

                    {runtimeError && (
                      <span>Erro: {runtimeError}</span>
                    )}

                    <span>
                      Plataforma: {deviceInfo?.platform ?? "Não identificada"}
                    </span>

                    <span>
                      Execução nativa: {deviceInfo
                        ? deviceInfo.native ? "Sim" : "Não"
                        : "Não identificada"}
                    </span>

                    <span>
                      Núcleos lógicos: {deviceInfo?.logicalCores ?? "Não identificados"}
                    </span>

                    <span>
                      RAM estimada: {formatGB(deviceInfo?.memoryEstimateGB)}
                    </span>

                    <span>
                      Armazenamento da aplicação: {formatGB(appStorage?.usageGB)}
                    </span>

                    <span>
                      Cota estimada da aplicação: {formatGB(appStorage?.quotaGB)}
                    </span>

                    <span>
                      Conexão: {deviceInfo
                        ? deviceInfo.online ? "Online" : "Offline"
                        : "Não identificada"}
                    </span>

                    <span>
                      Compatibilidade NCS: {
                        compatibility?.level ?? "Não testada"
                      }
                    </span>

                    {compatibility?.passed.map((item, index) => (
                      <span key={`passed-${index}`}>✓ {item}</span>
                    ))}

                    {compatibility?.unknown.map((item, index) => (
                      <span key={`unknown-${index}`}>? {item}</span>
                    ))}

                    {compatibility?.failed.map((item, index) => (
                      <span key={`failed-${index}`}>✕ {item}</span>
                    ))}

                    <small>
                      Diagnóstico inicial. Algumas informações podem não estar
                      disponíveis no navegador ou Android WebView.
                    </small>
                  </div>
                </div>
              ) : section !== "chat" ? (
                <div className="module-note">
                  <Sparkles size={18} />
                  <div>
                    <b>{title} está no roteiro.</b>
                    <span>
                      Este módulo ainda não foi implementado.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="composer-area">
            <div className="composer-label">
              <span>ASSISTENTE</span>
              <span className="offline">
                <i />
                {cloudConfigured
                  ? "SERVIDOR CONFIGURADO"
                  : "AGUARDANDO CONEXÃO"}
              </span>
            </div>

            <form className="composer" onSubmit={sendMessage}>
              <textarea
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                placeholder="Escreva sua ideia..."
                rows={2}
                disabled={loading}
              />

              <div className="composer-bottom">
                <span>
                  {loading
                    ? "NEXORA está processando..."
                    : "As respostas dependem de um motor conectado."}
                </span>

                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  aria-label="Enviar mensagem"
                >
                  <ArrowUp size={19} />
                </button>
              </div>
            </form>

            {error && (
              <div className="chat-error" role="alert">
                <b>Não foi possível obter uma resposta.</b>
                <span>{error}</span>
              </div>
            )}

            <p className="footnote">
              NEXORA AI · Respostas reais, sem simulações.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
