# Implementação das tabelas do banco_qualidade

Todas as 18 tabelas do ERD foram implementadas seguindo o padrão existente do
projeto: `model → repository (com cache Redis) → service → controller → routes`.
Todas as rotas estão protegidas por `authMiddleware`.

## Migração do banco
Arquivo: `src/database/migrations/001_init_qualidade.sql`
Execute uma vez no PostgreSQL (schema `teste`):

```bash
psql "$DATABASE_URL" -f src/database/migrations/001_init_qualidade.sql
```

Ajustes em relação ao SQL original: criação do schema e da sequence
`teste.section_id_seq`, e correção das colunas de FK que estavam como
`bigserial` (credentials.user_id, credentials.system_id, sessions.credential_id)
para `bigint`.

## Endpoints (prefixo /api)

| Recurso              | Rota                         | Operações                      |
|----------------------|------------------------------|--------------------------------|
| Usuários             | /users                       | CRUD                           |
| Sistemas             | /systems                     | CRUD                           |
| Perfis (roles)       | /roles                       | CRUD                           |
| Seções               | /sections                    | CRUD                           |
| Formulários          | /forms                       | CRUD                           |
| Respostas            | /answers                     | CRUD                           |
| Máquinas             | /machines                    | CRUD                           |
| Credenciais          | /credentials                 | CRUD (senha via bcrypt)        |
| Credencial x Perfil  | /credentials-roles           | criar / listar / remover       |
| Sessões              | /sessions                    | criar / listar / revogar / del |
| Funcionários         | /employees                   | CRUD (upsert por id)           |
| Empregadores         | /employers                   | CRUD                           |
| Departamentos        | /departments                 | CRUD                           |
| Cargos               | /job-positions               | CRUD                           |
| Centros de custo     | /cost-centers                | CRUD                           |
| Turnos               | /workshifts                  | CRUD                           |
| Grupos de posto      | /workstation-groups          | CRUD                           |
| Logs de sync         | /sync-logs                   | criar / listar / buscar / del  |

## Autenticação (adaptada ao novo schema)
No ERD a senha saiu de `users` e foi para `credentials` (com perfis via
`credentials_roles`). O fluxo de login foi adaptado:

`POST /api/auth/login` com `{ username | email, password, systemId? }`
1. encontra o `user` por email/username;
2. busca a `credential` (do `systemId` informado, ou a primeira do usuário);
3. valida a senha com bcrypt contra `senha_hash`;
4. carrega os perfis via `credentials_roles → roles`;
5. retorna `{ token, refreshToken }` e grava um registro em `sessions`.

O JWT passa a carregar `{ id, credentialId, roles[] }`. O `roleMiddleware`
agora verifica interseção com o array `roles`.

## Worker de logs de requisição/resposta

Pipeline de log das chamadas HTTP da API, reaproveitando a lib **morgan** e a
classe **MongoRepository** já existentes:

1. `middlewares/requestLogger.middleware.ts` — morgan monta, a cada chamada, um
   documento estruturado (método, url, status, tempo de resposta, tamanho, IP,
   user-agent, referrer, `userId` quando autenticado, além do corpo da
   requisição e da resposta). Campos sensíveis (senha, token, authorization…)
   são redigidos e corpos muito grandes são truncados. Também imprime uma linha
   legível no console.
2. `services/requestLog.buffer.ts` — fila em memória que acumula os logs.
3. `workes/requestLog.worker.ts` — worker `node-cron` (padrão: a cada 10s) que
   drena a fila e grava os logs em lote no Mongo via `MongoRepository.bulkWrite`
   (uma ida ao banco por ciclo, em vez de uma por request). Em erro, devolve o
   lote à fila; faz flush final em `SIGINT`/`SIGTERM`.
4. `repositories/requestLog.repository.ts` — grava na collection `request_logs`
   (database `hcm`) e expõe `findRecent()` para auditoria.

Registrado no `WorkerManager` junto ao `SeniorSyncWorker` e ativado em `app.ts`
via `app.use(requestLogger)` (substitui o antigo `morgan('combined')`).

### Variáveis de ambiente (opcionais, com defaults)

| Variável                  | Default          | Descrição                              |
|---------------------------|------------------|----------------------------------------|
| MONGO_LOG_DB              | hcm              | database dos logs                      |
| MONGO_LOG_COLLECTION      | request_logs     | collection dos logs                    |
| REQUEST_LOG_FLUSH_CRON    | */10 * * * * *   | frequência do flush (cron com segundos)|
| REQUEST_LOG_BUFFER_MAX    | 10000            | teto da fila em memória                |
| REQUEST_LOG_MAX_BODY      | 10000            | tamanho máx. (chars) do corpo logado   |
