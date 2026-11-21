# NEXORA AI — Android First

Aplicativo Android em desenvolvimento, construído com React, TypeScript, Vite e Capacitor.

## Estado da versão 0.1.0

- Interface Android-first.
- Navegação entre áreas planejadas.
- Layout adaptável para celular.
- Workflow do GitHub Actions para gerar APK de depuração.
- **O motor de IA ainda não está conectado.** O chat não simula respostas.

## Requisitos locais

- Node.js 20+
- npm
- Android Studio + Android SDK (para build local)

## Executar a interface

```bash
npm install
npm run dev
```

## Gerar o projeto Android

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

No Android Studio, compile a variante `debug`.

## Gerar APK pelo GitHub Actions

1. Envie os arquivos deste projeto para a branch `main`.
2. Abra a aba **Actions** do repositório.
3. Selecione **Build Android APK**.
4. Clique em **Run workflow**.
5. Quando terminar, abra a execução e baixe o artefato `Nexora-AI-debug-apk`.

O APK de depuração é para testes. Para distribuição pública, será necessário configurar assinatura de release.

## Identidade

- Nome: NEXORA AI
- Application ID: `br.com.edrim2.nexoraai`
- Versão inicial: `0.1.0`
