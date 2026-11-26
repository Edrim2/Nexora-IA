🧠 NEXORA AI

Embedded Intelligence • Self-Hosted • Multiplatform

O NEXORA AI é uma plataforma de inteligência artificial modular e multiplataforma, projetada para executar seu próprio núcleo diretamente no dispositivo, utilizando os recursos disponíveis de celulares e computadores.

A proposta é oferecer uma infraestrutura independente, capaz de hospedar serviços localmente, gerenciar módulos internos, armazenar memória e conectar diferentes dispositivos sem exigir obrigatoriamente um servidor externo.

Estado atual: versão 0.1.0 em desenvolvimento. Os recursos descritos como planejados ainda não estão implementados ou validados.

---

🚀 Visão e funcionalidades

- Embedded Runtime (NER): núcleo interno responsável pela execução e gerenciamento dos componentes.
- Self-Hosted: utilização do próprio celular ou computador como servidor.
- Hybrid Engine: integração entre recursos locais e serviços remotos.
- Local Memory: armazenamento persistente no dispositivo.
- Modular Intelligence: suporte planejado a agentes, ferramentas e módulos independentes.
- Multi-Device: comunicação entre diferentes dispositivos.
- Hardware Detection: identificação automática dos componentes disponíveis.

🖥️ NEXORA Compatibility System (NCS)

Sistema planejado para analisar o hardware e determinar quais recursos do NEXORA podem funcionar em cada dispositivo.

Componentes analisados

- Processador (CPU)
- Memória RAM
- Placa gráfica (GPU)
- Memória gráfica (VRAM)
- Armazenamento
- Sistema operacional
- Arquitetura e recursos de aceleração

Classificação de compatibilidade

Classificação| Significado
Compatível| Atende aos requisitos
Limitado| Funciona com restrições
Não compatível| Não atende aos requisitos
Não testado| Ainda sem validação

O NCS deverá distinguir resultados de testes reais de estimativas de compatibilidade.

💻 Compatibilidade multiplataforma

Android

Plataforma inicial, com execução local e integração com recursos nativos.

Windows

Objetivo de compatibilidade com:

- Windows 7 SP1
- Windows 8
- Windows 8.1
- Windows 10
- Windows 11

Sistemas antigos terão uma trilha Legacy, sujeita à compatibilidade das dependências e APIs necessárias.

Desktop e Web

Expansão planejada para computadores e navegadores, preservando o máximo possível do núcleo compartilhado.

⚙️ Arquitetura planejada

Componente| Tecnologia
Interface| React + TypeScript
Build| Vite
Android| Capacitor
Runtime| NEXORA Embedded Runtime
API local| Serviço integrado
Banco de dados| SQLite
Comunicação| HTTP / WebSocket
IA| Adaptadores locais e remotos
Compatibilidade| NEXORA Compatibility System

📂 Módulos planejados

- "core/": núcleo principal.
- "runtime/": execução e gerenciamento.
- "memory/": memória persistente.
- "services/": serviços locais.
- "intelligence/": integração de IA.
- "modules/": ferramentas e extensões.
- "compatibility/": detecção e avaliação de hardware.
- "storage/": armazenamento interno.

📊 Estado da versão 0.1.0

- [x] Interface Android-first.
- [x] Navegação entre áreas planejadas.
- [x] Layout adaptável para celular.
- [x] Workflow do GitHub Actions para APK de depuração.
- [ ] NEXORA Embedded Runtime.
- [ ] Self-Hosted Core.
- [ ] Banco de dados e memória local.
- [ ] NEXORA Compatibility System.
- [ ] Hardware Detector.
- [ ] Integração com mecanismos de IA.
- [ ] Suporte Desktop.
- [ ] Compatibilidade Legacy.

Importante: o motor de IA ainda não está conectado. O chat não simula respostas.

🛠️ Requisitos de desenvolvimento

- Node.js 20+
- npm
- Android Studio
- Android SDK

Esses são requisitos para desenvolvimento, não os requisitos mínimos de execução do produto final.

▶️ Executar a interface

npm install
npm run dev

📱 Gerar o projeto Android

npm run build
npx cap add android
npx cap sync android
npx cap open android

No Android Studio, compile a variante "debug".

📦 Gerar APK pelo GitHub Actions

1. Envie os arquivos do projeto para a branch "main".
2. Abra a aba Actions.
3. Selecione Build Android APK.
4. Clique em Run workflow.
5. Baixe o artefato "Nexora-AI-debug-apk" quando a execução terminar.

O APK de depuração é destinado a testes. Para distribuição pública, será necessária uma assinatura de release.

🧭 Roadmap

1. Consolidar a arquitetura atual.
2. Desenvolver o Embedded Runtime.
3. Implementar serviços e armazenamento locais.
4. Construir o Self-Hosted Core.
5. Desenvolver o Hardware Detector.
6. Implementar o Compatibility System.
7. Validar Android e Windows.
8. Investigar suporte Legacy para sistemas antigos.
9. Expandir os agentes e mecanismos de IA.

🪪 Identidade

- Nome: NEXORA AI
- Application ID: "br.com.edrim2.nexoraai"
- Versão: "0.1.0"
- Licença: MIT

---

NEXORA AI: sua inteligência, sua máquina, sua infraestrutura.
