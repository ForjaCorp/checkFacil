# 🎉 CheckFacil - Backend API

Sistema de gestão de festas infantis do **Espaço Criar**, responsável por:
- Lógica de negócios
- Autenticação via JWT
- Gestão de festas, clientes e convidados
- Integrações com webhooks (n8n)

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** – Ambiente de execução JavaScript
- **Express.js** – Framework para criação de APIs
- **Sequelize** – ORM para MySQL
- **MySQL** – Banco de dados relacional
- **JWT** – Autenticação de rotas
- **Axios** – Requisições HTTP (ex: integração com n8n)
- **CORS** – Liberação de origens para o frontend
- **dotenv** – Variáveis de ambiente
- **bcryptjs** – Hash seguro de senhas
- **Yarn Workspaces** – Monorepo

---

## ⚙️ Configuração do Ambiente

### ✔️ Pré-requisitos

- Node.js `v22.x` ou superior  
- Yarn `v4.x` ou superior  
- Banco de dados MySQL ativo  

### 📦 Instalação

Na pasta raiz do projeto, rode:

```bash
yarn install
```

### 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `/server` com:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=checkfacil_db
DB_PORT=3306

# JWT
JWT_SECRET=gere_um_segredo_forte_e_aleatorio_aqui

# Porta do Servidor
PORT=3001

# URL do frontend (links enviados via WhatsApp)
FRONT_URL=https://seu-dominio.com

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE_NAME=nome_da_instancia

# Web Push (notificacoes na barra do aparelho)
# Gerar com: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_SUBJECT=mailto:contato@seu-dominio.com
```

---

## 🚀 Execução do Projeto

Modo desenvolvimento (somente o backend):

```bash
yarn dev:server
```

Frontend + Backend juntos:

```bash
yarn dev
```

A API estará disponível em: [http://localhost:3001](http://localhost:3001)

---

## 🔐 Endpoints de Autenticação (`/api/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register/admFesta` | — | Cadastro de cliente (organizador de festa). |
| POST | `/auth/register/admEspaco` | ADM_ESPACO | Cadastro de administrador do espaço. |
| POST | `/auth/register/convidado` | ADM_ESPACO | Cadastro de convidado (aceita `idFesta` opcional para vincular à lista da festa por telefone). |
| POST | `/auth/login` | — | Login por e-mail **ou telefone** + senha. Retorna JWT. |
| POST | `/auth/forgot-password` | — | Solicita redefinição de senha (link via WhatsApp). |
| POST | `/auth/definir-senha` | — | Define senha via token de convite/redefinição. |
| GET | `/auth/me` | JWT | Valida sessão e retorna dados do usuário (inclui `fotoUrl`, `telefone`). |
| PUT | `/auth/me` | JWT | Atualiza perfil (`nome`, `email`, `telefone` normalizado, `foto` multipart até 2 MB). |

#### 🔸 Gestão de equipe (`/auth/adms`, todas ADM_ESPACO)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/adms` | Lista administradores do espaço. |
| POST | `/auth/adms/convidar` | Convida adm (nome, e-mail, telefone) e envia link de senha via WhatsApp. |
| POST | `/auth/adms/:id/redefinir-senha` | Reenvia link de redefinição de senha via WhatsApp. |
| DELETE | `/auth/adms/:id` | Exclui administrador (bloqueia excluir a si mesmo e titulares do `.env`). |

#### 🔸 Exemplo: Cadastro de Usuário (POST `/auth/register/...`)

```json
{
  "nome": "Nome do Administrador",
  "email": "admin@exemplo.com",
  "senha": "senha_forte_aqui",
  "telefone": "79999999999"
}
```

#### 🔸 Exemplo: Login (POST `/auth/login`)

```json
{
  "email": "admin@exemplo.com",
  "senha": "senha_forte_aqui"
}
```

---

## 🎉 Endpoints de Festas (`/festa`)

🔐 Autenticação JWT obrigatória, exceto nas rotas marcadas como **pública**.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/festa/criar` | Cria uma festa e associa um cliente (cria conta se o e-mail for novo; WhatsApp de boas-vindas). |
| GET | `/festa/listar` | Lista festas com filtros e permissões (adm vê todas, cliente só as suas). |
| GET | `/festa/:idFesta` | Busca os detalhes de uma festa específica. |
| GET | `/festa/:idFesta/public` | **Pública** — dados mínimos da festa para a página de confirmação do convidado. |
| POST | `/festa/:idFesta/register-guest-group` | **Pública** — confirmação de grupo de convidados (link do convite). |
| POST | `/festa/:idFesta/register-adults` | **Pública** — confirmação de adultos (link do convite). |
| PATCH | `/festa/:idFesta` | Atualiza uma festa específica. |
| DELETE | `/festa/:idFesta` | Remove uma festa do sistema. |
| POST | `/festa/:idFesta/reenviar-link-senha` | Reenvia link de definição de senha do organizador via WhatsApp. |
| POST | `/festa/:idFesta/disparar-mensagem` | Dispara mensagem em massa no WhatsApp (filtros por presença/confirmação). |
| POST | `/festa/:idFesta/convite/upload` | Upload da imagem do convite (multipart, campo `arquivo`). |

#### 🔸 POST `/festa/criar`

Descrição: Chamado pelo **AdmEspaco** para iniciar o registo de uma festa. Cria a conta do cliente se o email for novo.

Exemplo de Corpo:

```json
{
  "dadosFesta": {
    "nome_festa": "Aniversário Espacial do Lucas",
    "data_festa": "2025-10-15",
    "horario_inicio": "14:00:00",
    "horario_fim": "18:00:00",
    "local_festa": "Espaço Play + Park",
    "descricao": "Festa temática de astronautas e planetas, com muitas atividades interativas para as crianças.",
    "pacote_escolhido": "PLAY_MAIS_PARK",
    "numero_adultos_contratado": 25,
    "numero_criancas_contratado": 30,
    "nome_aniversariante": "Lucas",
    "idade_aniversariante": 8,
    "tema_festa": "Aventura no Espaço",
    "festa_deixa_e_pegue": true,
    "autoriza_uso_imagem": true,
    "instagram_cliente": "@familia_do_lucas",
    "procedimento_convidado_fora_lista": "CHAMAR_ANFITRIAO",
    "link_playlist_spotify": "https://open.spotify.com/playlist/sua_playlist_aqui",
    "observacoes_festa": "O bolo será entregue pelo fornecedor às 13h. Contratado serviço de fotografia à parte."
  },
  "dadosCliente": {
    "nome": "Carla (Mãe do Lucas)",
    "email": "carla.mae.lucas@exemplo.com",
    "telefone": "79911223344"
  }
}
```

#### 🔸 GET `/festa/listar`

Descrição: Lista festas com base na permissão (AdmEspaco vê todas; outros utilizadores veem apenas as suas). A rota agora suporta múltiplos filtros combinados e paginação.

Filtros e Paginação (Query Params):

- Busca Textual: `?search=Leo` (procura em `nome_festa` e `nome_aniversariante`)
- Filtro por Status: `?status=RASCUNHO`
- Filtro por Data Exata: `?data=2025-12-25`
- Filtro por Intervalo de Datas: `?data_inicio=2025-12-01&data_fim=2025-12-31`
- Paginação: `?page=1&limit=10`

Exemplo de Uso Combinado:

```http
GET /festa/listar?search=Aniversário&status=PRONTA&page=1&limit=5
```

---

## 🧑‍🤝‍🧑 Endpoints de Convidados (`/festa/:idFesta/...`)

> Gerenciamento de convidados vinculados a uma festa. Requer autenticação JWT.

| Método | Rota                               | Descrição                             |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/convidados`                      | Adiciona um novo convidado à festa.   |
| GET     | `/convidados`                      | Lista todos os convidados da festa.   |
| GET     | `/convidados/buscar`               | Busca convidados pelo nome.           |
| GET     | `/convidados/:idConvidado`        | Busca um convidado específico por ID. |
| PATCH   | `/convidados/:idConvidado`        | Atualiza um convidado específico.     |
| DELETE  | `/convidados/:idConvidado`        | Remove um convidado específico.       |
| PATCH   | `/convidados/:idConvidado/checkin`| Realiza o check-in de um convidado.
| PATCH   | `/convidados/:idConvidado/checkout`| Realiza o check-out de um convidado.
| GET     | `/convidados/download`              | Exporta a lista de convidados.
| POST    | `/convidados/:idConvidado/checkin-grupo`  | Check-in do grupo (responsável + crianças).
| POST    | `/convidados/:idConvidado/checkout-grupo` | Check-out do grupo. |

#### 🔸 POST `/festa/:idFesta/convidados`

Exemplo de Corpo Completo:

```json
{
  "nome_convidado": "Pedro Alves (Filho)",
  "idade_convidado": 8,
  "data_nascimento": "2017-10-20",
  "tipo_convidado": "CRIANCA_PAGANTE",
  "e_crianca_atipica": false,
  "telefone_convidado": null,
  "nome_responsavel": "Marcos Alves (Pai)",
  "telefone_responsavel": "79955667788",
  "nome_acompanhante": "Marcos Alves (Pai)",
  "telefone_acompanhante": "79955667788",
  "observacao_convidado": "Alergia a lactose.",
  "confirmou_presenca": "SIM"
}
```

#### 🔸 GET `/festa/:idFesta/convidados/buscar`

Exemplo de Uso: `GET /festa/15/convidados/buscar?nome=Alves`

#### 🔸 PATCH `/festa/:idFesta/convidados/:idConvidado`

Exemplo de Corpo: (envie apenas os campos a alterar)

```json
{
  "nome_convidado": "Pedro dos Santos Alves",
  "observacao_convidado": "Alergia a lactose e a amendoim."
}
```

#### 🔸 PATCH `/festa/:idFesta/convidados/:idConvidado/checkin` | `/checkout`

Descrição: Realiza o check-in ou o check-out. **Ação restrita ao Staff (AdmEspaco)**.

Corpo: Nenhum (ou `{}`).

---

## 🎵 Endpoints de Playlists (`/api/playlists`)

🔐 Autenticação JWT obrigatória.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/playlists` | Lista playlists (adm vê todas, cliente só as suas). |
| POST | `/playlists` | Cria uma playlist. |
| GET | `/playlists/:id` | Detalha uma playlist. |
| PATCH | `/playlists/:id` | Atualiza uma playlist. |
| DELETE | `/playlists/:id` | Remove uma playlist. |
| POST | `/playlists/:id/musicas` | Adiciona música à playlist. |
| DELETE | `/playlists/:id/musicas/:idMusica` | Remove música da playlist. |

---

## 📱 WhatsApp — Evolution API (`/api/evolution`)

🔐 Autenticação JWT obrigatória (adm). Gerencia a instância conectada.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/evolution/status` | Status da conexão (conectado/desconectado). |
| GET | `/evolution/qr` | QR Code para conectar o WhatsApp. |
| POST | `/evolution/start` | Inicia a sessão da instância. |
| POST | `/evolution/logout` | Desloga a sessão atual. |
| POST | `/evolution/restart` | Reinicia a instância. |
| POST | `/evolution/logoff` | Encerra a instância. |

---

## 🎪 Eventos do Espaço (`/api/eventos-espaco`)

Eventos abertos/temáticos do espaço (colônia de férias, dia das mães...), com link de ingresso (Sympla).

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/eventos-espaco` | JWT | Lista eventos **publicados** (visível a clientes). |
| GET | `/eventos-espaco/admin` | ADM_ESPACO | Lista todos os eventos (rascunho + publicados). |
| POST | `/eventos-espaco` | ADM_ESPACO | Cria evento (multipart: campos texto + `imagem` até 4 MB, JPG/PNG/WEBP). |
| PUT | `/eventos-espaco/:id` | ADM_ESPACO | Atualiza evento (mesmos campos; imagem opcional). |
| DELETE | `/eventos-espaco/:id` | ADM_ESPACO | Exclui evento e a imagem do disco. |
| POST | `/eventos-espaco/:id/publicar` | ADM_ESPACO | Alterna publicação. Ao **publicar**, dispara push para todos os clientes. |

---

## 🔔 Notificações Push (`/api/push`)

Web Push (VAPID) — notificações na barra de notificações do celular/desktop.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/push/chave-publica` | — | Chave pública VAPID (para o front inscrever o dispositivo). |
| POST | `/push/inscrever` | JWT | Registra/atualiza a assinatura do dispositivo. |
| DELETE | `/push/inscrever` | JWT | Remove a assinatura do dispositivo. |
| POST | `/push/teste` | JWT | Envia push de teste ao próprio usuário. |

> No iPhone (iOS 16.4+), o push só é entregue com o PWA instalado na tela de início.

---

## 📦 Arquivos Estáticos (`/uploads`)

- `GET /uploads/avatars/<arquivo>` — fotos de perfil.
- `GET /uploads/eventos/<arquivo>` — imagens de divulgação dos eventos do espaço.
- `GET /uploads/convites/<arquivo>` — imagens de convite.

---

## ⏰ Jobs Agendados (node-cron)

- **Lembrete de dados incompletos** — diário às 09:00 (`America/Fortaleza`): identifica festas a até 7 dias da data com dados pendentes (pacote, horário, convidados cadastrados < contratado) e envia WhatsApp ao cliente contratante. Máx. 1 lembrete/semana por festa, 3 tentativas, cancelado automaticamente se os dados forem completados ou a festa cancelada. Fila na tabela `notificacoes_agendadas`.
- Em desenvolvimento (`NODE_ENV != production`), um ciclo roda ~5s após o boot.
