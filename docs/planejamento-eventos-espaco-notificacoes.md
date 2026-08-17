# Planejamento — Eventos do Espaço, Notificações Push, Lembretes WhatsApp e Ajuste de Modelagem

> Status: **EM DISCUSSÃO → aguardando aprovação para execução**
> Data: 2026-08-15

## 1. Contexto e objetivo

O Check Fácil hoje gira em torno de **festas privadas** (organizador contratante + convidados com check-in). Este plano adiciona quatro frentes:

1. **Modelagem**: ponte entre `convidadosFesta` e `usuarios`.
2. **Eventos do Espaço**: eventos abertos/temáticos (colônia de férias, dia das mães, dia das crianças...) com divulgação e link de compra (Sympla).
3. **Push na barra de notificações** do aparelho (Web Push / PWA).
4. **Lembretes automáticos via WhatsApp** (ex.: dados da festa incompletos 1 semana antes).

## 2. Decisões já tomadas (com o dono do produto)

| Tema | Decisão | Motivo |
|---|---|---|
| Convidados ↔ Usuários | **FK opcional `id_usuario`** em `convidadosFesta` | Ganha a ponte sem inflar `usuarios` nem migrar em massa; convidado só vira `Usuario` quando cria conta |
| Eventos do Espaço | **Tabela nova `eventos_espaco`** | Sem contaminar a semântica de `festa` (organizador obrigatório, pacote, check-in) |
| Canal de avisos na barra | **Só Web Push** (VAPID) | WhatsApp permanece apenas nos fluxos que já existem + lembretes do item 4 |
| Lembretes automáticos | **Fila `notificacoes_agendadas` + job diário (node-cron)** | Idempotência, status/erro, extensível para novos tipos |

**Interpretação confirmada dos canais:**
- Avisos de **novos eventos do espaço** → **Push**.
- **Lembretes operacionais** (dados incompletos da festa) → **WhatsApp** via fila agendada.

---

## 3. Épico 1 — FK opcional `id_usuario` em `convidadosFesta`

### Modelagem
```sql
ALTER TABLE convidadosFesta
  ADD COLUMN id_usuario INT NULL,
  ADD CONSTRAINT fk_convidado_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id);
```
- Coluna **nullable** — registro de participação continua válido sem conta.
- Aplicação via `sync --alter` (rotina já usada) + `addColumn` defensivo no boot (padrão já usado para `fotoUrl`).

### Vínculo (quando nasce)
- Quando um convidado **confirma presença/cria conta** pelo fluxo de link (rota `registrarConvidado` já cria `Usuario` tipo `CONVIDADO`), gravar o `id_usuario` no `ConvidadoFesta` correspondente (match por telefone normalizado + festa).
- Dedupe futuro: duas festas, mesmo telefone → mesmo `Usuario` quando existir.

### Fora de escopo (explícito)
- Backfill automático de histórico (pode ser feito depois, script manual).
- Login de convidado no app (futuro).

---

## 4. Épico 2 — Eventos do Espaço (tabela nova)

### Modelagem `eventos_espaco`
| Campo | Tipo | Observação |
|---|---|---|
| id | INT PK AI | |
| titulo | STRING, NOT NULL | "Colônia de Férias Julho 2026" |
| descricao | TEXT | detalhes, faixa etária etc. |
| data_inicio | DATEONLY, NOT NULL | colonia de férias = período |
| data_fim | DATEONLY, NULL | null = evento de 1 dia |
| imagem_url | STRING | `/uploads/eventos/<file>` |
| link_ingresso | STRING | URL Sympla |
| publicado | BOOLEAN default false | só publicado aparece pro cliente |
| timestamps | createdAt/updatedAt | |

Upload de imagem: mesmo padrão do avatar (multer diskStorage, limite 2–4 MB, jpg/png/webp) em `server/uploads/eventos`.

### Endpoints
| Método | Rota | Acesso | Função |
|---|---|---|---|
| GET | `/api/eventos-espaco` | logado (cliente) | lista `publicado = true`, ordenado por data |
| GET | `/api/eventos-espaco/admin` | ADM_ESPACO | lista todos |
| POST | `/api/eventos-espaco` | ADM_ESPACO | cria (multipart com imagem) |
| PUT | `/api/eventos-espaco/:id` | ADM_ESPACO | edita |
| DELETE | `/api/eventos-espaco/:id` | ADM_ESPACO | exclui (e apaga imagem do disco) |
| POST | `/api/eventos-espaco/:id/publicar` | ADM_ESPACO | publica + **dispara push** (Épico 3) |

### UI/UX
**Adm do espaço (staff):**
- Tela CRUD "Eventos do Espaço" seguindo o padrão da tela de Administradores (Card + Dialog form).
- Acesso: item na sidebar (desktop) e botão no Perfil (mobile), como já feito para "Administradores".
- Publicação explícita (rascunho → publicar) para o disparo de push ser intencional.

**Cliente (Adm_festa / organizador):**
- Seção nova no dashboard: carrossel/banner com eventos publicados (imagem + título + data).
- Página `/organizer/eventos` com cards completos: imagem, título, período, descrição e botão **"Comprar ingresso"** → abre Sympla em nova aba (`target="_blank" rel="noopener"`).
- Bônus: botão compartilhar no WhatsApp no card (boca a boca).

---

## 5. Épico 3 — Push na barra de notificações (Web Push / VAPID)

O app **já é PWA** (`vite-plugin-pwa`, `generateSW`). Web Push requer ajustes:

### Infra
1. **VAPID**: gerar par de chaves (`npx web-push generate-vapid-keys`) → `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` no `.env` do server.
2. **Service worker custom**: o `generateSW` atual não tem handlers de `push`/`notificationclick`. Migrar o PWA para **`injectManifest`** com `sw.js` custom (mantendo workbox para precache) adicionando:
   - `push` → `self.registration.showNotification(payload)`
   - `notificationclick` → `focus()`/`openWindow(payload.url)`
3. **Dep**: `web-push` no server.

### Modelagem `push_subscriptions`
| Campo | Tipo |
|---|---|
| id | INT PK AI |
| endpoint | STRING UNIQUE (chave por dispositivo) |
| p256dh / auth | STRING (chaves da inscrição) |
| id_usuario | INT NULL FK usuarios |
| user_agent | STRING |
| timestamps | createdAt/updatedAt |

### Endpoints
| Método | Rota | Função |
|---|---|---|
| GET | `/api/push/chave-publica` | entrega VAPID public key ao front |
| POST | `/api/push/inscrever` | salva subscription (logado) |
| DELETE | `/api/push/inscrever` | remove subscription |
| POST | `/api/push/teste` | envia push de teste ao próprio usuário |

### Serviço `pushService.js`
- `enviarPush({ title, body, url, tag }, destinatarios)` — destinatários: `id_usuario` específico, lista, ou "todos os Adm_festa" (broadcast de evento).
- Trata `410 Gone` (endpoint expirado) removendo a inscrição morta.

### UX de permissão (front)
- Botão **"Ativar notificações"** no dashboard do cliente e no Perfil.
- Fluxo: `Notification.requestPermission()` → `subscribe()` → POST `/api/push/inscrever`.
- **iOS (16.4+)**: push só chega se o PWA estiver **instalado na tela de início**. Detectar `display-mode: standalone` + iOS e exibir instrução "Adicione à Tela de Início" quando aplicável.

### Disparo inicial (regra de negócio)
- Ao **publicar** um Evento do Espaço → push para **todos os clientes (Adm_festa)**: `{ title: 'Novo evento no espaço!', body: <titulo>, url: '/organizer/eventos' }`.

### Limitação conhecida
- iPhone sem app instalado **não recebe** push (regra da Apple). Não há contorno em PWA; caminho nativo (app store) fica fora deste plano.

---

## 6. Épico 4 — Fila de notificações agendadas + cron (lembretes WhatsApp)

### Modelagem `notificacoes_agendadas`
| Campo | Tipo | Observação |
|---|---|---|
| id | INT PK AI | |
| tipo | ENUM('DADOS_INCOMPLETOS') | extensible (novos tipos futuros) |
| id_festa | INT NULL FK festas | |
| id_destinatario | INT FK usuarios | organizador contratante |
| agendado_para | DATETIME | |
| status | ENUM('PENDENTE','ENVIADA','FALHOU','CANCELADA') | |
| enviado_em | DATETIME NULL | |
| tentativas | INT default 0 | |
| erro | TEXT NULL | |
| timestamps | createdAt/updatedAt | |

### Checklist "dados incompletos" (proposta, campos do model `Festa`)
Festa está incompleta se `status` IN ('RASCUNHO','AGUARDANDO_CLIENTE') **ou** qualquer um:
- `pacote_escolhido` é null;
- `horario_inicio`/`horario_fim` null;
- nº de `convidadosFesta` cadastrados < `numero_convidados_contratado`.

### Job (node-cron)
- Diário, **09:00, timezone `America/Fortaleza`**.
- Passo 1 (agendamento): festas a **7 dias ou menos** da `data_festa`, com dados incompletos, sem notificação `DADOS_INCOMPLETOS` **enviada nos últimos 7 dias** → cria linha `PENDENTE` (`agendado_para` = agora).
- Passo 2 (envio): processa `PENDENTE`s vencidas → `enviarLembreteDadosIncompletos()` no `whatsappService` (template com nome do cliente, festa, data e deep link `/organizer/event/<id>/details`) → marca `ENVIADA` ou `FALHOU` (+erro).
- Guarda de spam: máx. **1 lembrete/semana por festa por tipo**; festa `CANCELADA`/`CONCLUIDA` cancela pendências.

### Servidor
- Cron inicializado no `LigarServidor()` (após `app.listen`), com try/catch global pra nunca derrubar o processo.

---

## 7. Ordem de execução proposta (fases)

| Fase | Conteúdo | Valor |
|---|---|---|
| 1 | Épico 2 completo **sem** disparo de push (CRUD + telas + listagem cliente) | Feature visível rápido, zero risco |
| 2 | Épico 3 (infra push + botão ativar + disparo na publicação) | Divulgação automática |
| 3 | Épico 4 (fila + cron + lembrete dados incompletos) | Retenção de dados das festas |
| 4 | Épico 1 (FK opcional + vínculo na confirmação) | Fundação para futuro |

*Justificativa: 1 e 2 entregam o pedido mais estratégico (eventos + divulgação); 4 é o de menor urgência (base para features futuras).*

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Migração `generateSW` → `injectManifest` quebrar cache/offline atual | Testar PWA install + offline depois da troca; manter workbox precache idêntico |
| Push não entregue no iPhone sem instalação | UX de instrução A2HS; documentar limitação |
| Evolution API fora do ar no envio do lembrete | Status FALHOU + reprocessamento no próximo ciclo (tentativas) |
| Colunas novas em produção | Todas nullable/default; `sync --alter` já é rotina |
| LGPD | Push é opt-in; lembretes para relação contratual existente; dados mínimos por tabela |

## 9. Pontos em aberto (decidir na execução)

1. Checklist final de "dados incompletos" — validar os 3 critérios propostos com a operação do espaço.
2. Push: enviar para **todos os Adm_festa** mesmo quem nunca comprou? (proposta: sim, todos logados inscritos).
3. Imagem do evento: limite de tamanho (2 MB como avatar, ou 4 MB?).
4. Nome do item de menu e rota cliente (`/organizer/eventos` proposto).
