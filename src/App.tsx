import { useState } from "react";
import {
  ArrowUp, BrainCircuit, Bot, Code2, Compass, Cpu, Menu,
  MessageSquare, Plus, Search, Settings2, Sparkles, Wrench, X
} from "lucide-react";

type Section = "chat" | "studio" | "research" | "tools";

const sections: { id: Section; label: string; icon: typeof Bot }[] = [
  { id: "chat", label: "Conversar", icon: MessageSquare },
  { id: "studio", label: "Studio", icon: Code2 },
  { id: "research", label: "Pesquisa", icon: Compass },
  { id: "tools", label: "Ferramentas", icon: Wrench }
];

export default function App() {
  const [section, setSection] = useState<Section>("chat");
  const [drawer, setDrawer] = useState(false);
  const [prompt, setPrompt] = useState("");

  const title = sections.find(item => item.id === section)?.label ?? "Conversar";

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // O envio fica desativado até conectarmos um modelo real.
    // Não exibimos respostas falsas nem simulamos inteligência.
    setPrompt("");
  }

  return (
    <div className="app">
      {drawer && <button className="scrim" aria-label="Fechar menu" onClick={() => setDrawer(false)} />}
      <aside className={`sidebar ${drawer ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><BrainCircuit size={23} /></div>
          <div><b>NEXORA</b><small>INTELLIGENCE STUDIO</small></div>
          <button className="close-menu" onClick={() => setDrawer(false)} aria-label="Fechar"><X size={19}/></button>
        </div>
        <button className="new-chat" onClick={() => { setSection("chat"); setDrawer(false); }}>
          <Plus size={18}/> Nova conversa
        </button>
        <div className="section-label">ESPAÇO DE TRABALHO</div>
        <nav>
          {sections.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
              onClick={() => { setSection(item.id); setDrawer(false); }}>
              <Icon size={18}/><span>{item.label}</span>
              {item.id !== "chat" && <small>EM BREVE</small>}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className="engine-icon"><Cpu size={18}/></div>
            <div><b>Motor de IA</b><small>Ainda não conectado</small></div>
            <i />
          </div>
          <button className="nav-item settings" onClick={() => alert("As configurações do motor de IA serão adicionadas na próxima etapa.")}>
            <Settings2 size={18}/><span>Configurações</span>
          </button>
          <div className="version">NEXORA AI <span>ANDROID · v0.1.0</span></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setDrawer(true)} aria-label="Abrir menu"><Menu size={21}/></button>
          <div className="page-title">{title}</div>
          <div className="top-status"><i/> <span>Prévia</span></div>
        </header>

        <section className="content">
          <div className="welcome">
            <div className="eyebrow"><Sparkles size={13}/> SEU ESPAÇO DE CRIAÇÃO</div>
            <div className="hero-icon"><BrainCircuit size={36}/></div>
            <h1>O próximo passo<br/><span>começa com uma ideia.</span></h1>
            <p>A NEXORA está tomando forma. Um espaço para pensar, investigar e transformar ideias em projetos.</p>

            <div className="cards">
              <button onClick={() => { setSection("studio"); }}><Code2/><b>Criar um projeto</b><small>Transforme uma ideia em software</small></button>
              <button onClick={() => { setSection("research"); }}><Search/><b>Investigar</b><small>Organize perguntas e evidências</small></button>
              <button onClick={() => { setSection("tools"); }}><BrainCircuit/><b>Explorar ferramentas</b><small>Conheça os módulos da NEXORA</small></button>
            </div>

            {section !== "chat" && (
              <div className="module-note">
                <Sparkles size={18}/>
                <div><b>{title} está no roteiro.</b><span>Este módulo ainda não foi implementado. Estamos construindo a fundação primeiro.</span></div>
              </div>
            )}
          </div>

          <div className="composer-area">
            <div className="composer-label"><span>ASSISTENTE</span><span className="offline"><i/> MOTOR NÃO CONECTADO</span></div>
            <form className="composer" onSubmit={sendMessage}>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Escreva sua ideia..." rows={2} />
              <div className="composer-bottom">
                <span>O chat será ativado quando conectarmos um modelo de IA.</span>
                <button disabled aria-label="Enviar"><ArrowUp size={19}/></button>
              </div>
            </form>
            <p className="footnote">Versão inicial de interface. Nenhuma resposta de IA é simulada.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
