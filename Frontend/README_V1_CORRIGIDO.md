# Suzuki Presença V1 — Frontend corrigido

Este pacote foi consolidado a partir do `Frontend(2).zip` reenviado pelo usuário em 17/08/2026.

## Ambientes

### Desenvolvimento (`.env`)
- API: `http://192.168.15.8/estudio-suzuki-api/public/api`
- Vite/tablet: `http://192.168.15.8:5173`
- Inicie com: `npm run dev -- --host 0.0.0.0`

### Produção (`.env.production`)
- API: `https://presencas.estudiosuzuki.com.br/api`
- Login/tablet: `https://presencas.estudiosuzuki.com.br/login`
- Gere com: `npm run build`

## Correções de consolidação
- Mantidas as funcionalidades atuais: Agenda/Aulas, QR Code, fotos, tablet, desfazer presença em 5 segundos, exclusões controladas e ícones coloridos.
- Removidos arquivos não referenciados: `TabletLoginQrCard.jsx`, `painel.css` e assets padrão do Vite/React.
- Removidos imports CSS duplicados de Dashboard e Usuários; esses estilos já são carregados por `App.css`.
- `api.js` exige `VITE_API_URL`, evitando chamadas silenciosas para a porta do Vite quando o `.env` estiver incorreto.

## Instalação local
```powershell
npm install
npm run dev -- --host 0.0.0.0
```

## Build de produção
```powershell
npm run build
```
Envie o conteúdo de `dist/` para o DocumentRoot do frontend em produção.
