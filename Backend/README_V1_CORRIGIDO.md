# Suzuki Presença V1 — Backend corrigido

Este pacote foi extraído e limpo a partir do `backend(1).zip` reenviado pelo usuário em 17/08/2026.

O ZIP recebido estava misturado com um projeto React/Vite inteiro. Neste pacote foram mantidos somente os arquivos reais do backend PHP/Slim.

## Estrutura
- `public/index.php`
- `public/.htaccess`
- `public/uploads/alunos/.htaccess`
- `src/Config`
- `src/Controllers`
- `src/Middleware`
- `src/Repositories`
- `composer.json`, `composer.lock` e `vendor/`

## Ambiente local
O `.env` incluído está preparado para:
- XAMPP/Apache: `/estudio-suzuki-api/public`
- frontend em: `http://192.168.15.8:5173`
- banco local: `estudio_suzuki_db`, usuário `root`, sem senha

## Produção
O backend não carrega `.env.production`; ele sempre carrega `.env`.
Use `.env.production.example` como modelo e copie seus valores para `.env` no servidor.

Produção esperada:
- `APP_BASE_PATH=` vazio
- `FRONTEND_ORIGIN=https://presencas.estudiosuzuki.com.br`
- usuário MySQL `suzuki_presenca`

## Uploads
As fotos reais dos alunos NÃO foram incluídas neste pacote. Isso evita sobrescrever dados de desenvolvimento/produção. A pasta mantém somente o `.htaccess` de proteção.

## Banco SQL
O arquivo `estudio_suzuki_db.sql` que veio no ZIP original NÃO foi incluído, pois está desatualizado em relação ao código atual (por exemplo, não representa corretamente `usuarios` e `aulas.horario_id`). Para backup/restauração, gere um novo dump do banco atual.
