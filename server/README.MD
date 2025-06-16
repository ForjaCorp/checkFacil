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

## 🔐 Endpoints de Autenticação (`/auth`)

> Todas as rotas relacionadas ao login e cadastro de usuários. Para criar usuarios é necessario o Token de um ADM_Festa logado

| Método | Rota                           | Descrição                                                       |
|--------|-------------------------------|-----------------------------------------------------------------------|
| POST   | `/auth/register/admFesta`     | Somente um usuarios admEspaco ja cadastrado pode criar um usuario novo, usando seu Token      |
| POST   | `/auth/register/admEspaco`     |  Somente um usuarios admEspaco ja cadastrado pode criar um usuario novo, usando seu Token     |
| POST   | `/auth/login`                  | Realiza login e retorna token JWT.                                    |
| POST   | `/auth/definir-senha`         | Permite definir senha via token de primeiro acesso.                  |

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

🔐 Autenticação Obrigatória para todas as rotas de festa (usar `Authorization: Bearer SEU_TOKEN`).

| Método | Rota               | Descrição                                       |
|--------|--------------------|-----------------------------------------------|
| POST   | `/festa/criar`     | Cria uma nova festa e associa um cliente.     |
| GET     | `/festa/listar`   | Lista festas com filtros e permissões.       |
| GET     | `/festa/:idFesta` | Busca os detalhes de uma festa específica.   |
| PATCH   | `/festa/:idFesta` | Atualiza uma festa específica.               |
| DELETE | `/festa/:idFesta` | Remove uma festa do sistema.                 |

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
| PATCH   | `/convidados/:idConvidado/checkin`| Realiza o check-in de um convidado.   |
| PATCH   | `/convidados/:idConvidado/checkout`| Realiza o check-out de um convidado. |

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
