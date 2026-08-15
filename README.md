# CheckFacil - Sistema de Gestão de Eventos

Bem-vindo ao repositório do CheckFacil! Esta é uma Aplicação Web Progressiva (PWA) completa, projetada para otimizar o gerenciamento de festas e eventos, com foco em um processo de check-in e check-out de convidados ágil e seguro.

## Visão Geral da Estrutura

Este projeto é um monorepo gerenciado com **Yarn Workspaces**, composto pelos seguintes pacotes:

* **`/client`**: Contém o frontend da aplicação (PWA), responsável pela interface do usuário para o Staff do evento e para os Clientes (organizadores da festa).
* **`/server`**: Contém a API backend, responsável pela lógica de negócios, autenticação, comunicação com o banco de dados e integrações externas.
* **`/infra`**: Contém a configuração de infraestrutura como código (IaC), incluindo o `Dockerfile` e arquivos `docker-compose` para deploy.

## ✨ Tecnologias e Padrões Principais

| Área | Tecnologia |
| :--- | :--- |
| **Monorepo** | [Yarn 4.x](https://yarnpkg.com/) (Workspaces), [Turborepo](https://turbo.build/repo), [TypeScript](https://www.typescriptlang.org/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) |
| **Qualidade de Código** | [Husky](https://typicode.github.io/husky/) + [Lint-Staged](https://github.com/okonet/lint-staged) para hooks de pre-commit automatizados. |
| **Frontend** | [React](https://react.dev/) (Vite), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [TanStack Query](https://tanstack.com/query/latest) (Server State), [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Sequelize](https://sequelize.org/) (ORM), [MySQL](https://www.mysql.com/), [JWT](https://jwt.io/) |
| **DevOps** | [Docker](https://www.docker.com/), [Coolify](https://coolify.io/) (deploy via `infra/docker-compose.yml`) |

## ⚙️ Configuração do Ambiente Local

### Pré-requisitos

* Node.js `v22.x` ou superior
* Yarn `v4.x` ou superior
* Docker e Docker Compose (para testes locais e deploy)

### Passos de Instalação

1. **Clone o repositório:**

    ```bash
    git clone https://github.com/ForjaCorp/checkFacil.git
    cd checkFacil
    ```

2. **Instale as dependências:**
    Este comando usará o Yarn Workspaces para instalar as dependências da raiz e de todos os pacotes (`client`, `server`).

    ```bash
    yarn install
    ```

3. **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto para o teste local com Docker e um em `/server/.env` para o desenvolvimento do backend.

    * **Raiz do Projeto (`/.env`) - Para `docker compose local`:**

        ```env
        # Banco de Dados (exemplo)
        DB_HOST=mysql_db
        DB_USER=user
        DB_PASSWORD=password
        DB_NAME=checkfacil_db
        DB_PORT=3306

        # JWT (essencial)
        JWT_SECRET=seu_segredo_super_secreto_aqui_para_docker

        # Porta do Servidor (essencial)
        PORT=3001
        ```

    * **Backend (`/server/.env`) - Para `yarn dev`:**
        *Use as mesmas variáveis acima, ajustando os dados do banco de dados se necessário para o seu ambiente local.*
        *Variáveis adicionais do servidor:*

        ```env
        # Evolution API (mensagens de WhatsApp)
        EVOLUTION_API_URL=https://evo4.4growthbr.space
        EVOLUTION_API_KEY=sua_apikey_aqui
        EVOLUTION_INSTANCE_NAME=Espaco

        # URL do frontend (usada nos links enviados via WhatsApp)
        FRONT_URL=https://espacocriar.4growthbr.space
        ```

    * **Frontend (`/client/.env.development`) - Para `yarn dev`:**
        *Emails que liberam as opções de administrador na UI em modo dev. Os mesmos valores devem existir em `/client/.env.production` para o build de produção.*

        ```env
        VITE_ADM_EMAIL_1=barradeespacoe@gmail.com
        VITE_ADM_EMAIL_2=adm2.espacocriaraju@gmail.com
        ```

        > **Atenção:** o Vite carrega `.env.development` em modo dev e `.env.production` no build (`vite build`). Se trocar um email, atualize os dois arquivos.

4. **Configuração do Editor (VS Code):**
    Para garantir que o VS Code utilize a versão correta do TypeScript gerenciada pelo Yarn, rode:

    ```bash
    yarn dlx @yarnpkg/sdks vscode
    ```

    Em seguida, no VS Code, use (Ctrl+Shift+P) para selecionar `TypeScript: Select TypeScript Version...` e escolha a **"Use Workspace Version"**.

## 🚀 Scripts Principais

Todos os comandos devem ser executados a partir da **raiz do monorepo**. O **Turborepo** gerencia a execução otimizada das tarefas.

* **Iniciar Ambiente de Desenvolvimento (Hot-Reload):**

    ```bash
    yarn dev
    ```

* **Banco de Dados (criar/atualizar tabelas):**

    O projeto usa `sequelize.sync()` — não há migrations estilo Prisma. As tabelas podem ser criadas/atualizadas de duas formas:

    1. **Automaticamente** ao subir o servidor (`yarn dev` ou `yarn start`) — o `server.js` roda o sync no startup.
    2. **Via terminal (recomendado para aplicar mudanças nos models):**

        ```bash
        # cria tabelas que faltam (não mexe nas existentes)
        yarn workspace @checkfacil/server sync

        # cria + ajusta colunas existentes pra baterem com os models
        yarn workspace @checkfacil/server sync --alter
        ```

        > **Importante:** o comando usa as credenciais do `/server/.env`. O `--alter` não dropa tabelas nem dados, mas revise o diff se as tabelas já tiverem dados em produção.

    > O banco (database/schema) em si não é criado pelo sync — crie-o antes com `CREATE DATABASE espacoCriar;` se ainda não existir. Um script de referência com o schema completo está em `/infra/init.sql`.

* **Construir todos os pacotes para produção:**

    ```bash
    yarn build
    ```

* **Testar a Imagem de Produção Localmente:**
    Este fluxo permite simular o ambiente de produção na sua máquina.

    1. **Construir a imagem Docker local:**

        ```bash
        yarn docker:build
        ```

    2. **Subir o container:**

        ```bash
        yarn docker:up
        ```

    3. **Derrubar o container após o teste:**

        ```bash
        yarn docker:down
        ```

## Linting e Qualidade de Código

A qualidade e a formatação do código são garantidas automaticamente através de um **hook de pre-commit** gerenciado por **Husky** e **Lint-Staged**. Antes de cada `git commit`, `eslint --fix` e `prettier --write` são executados nos arquivos modificados.

Para rodar as verificações manualmente em todo o projeto, use:

* **Verificar Linting:**

    ```bash
    yarn lint
    ```

* **Verificar Formatação:**

    ```bash
    yarn format:check
    ```

* **Corrigir Linting e Formatação:**

    ```bash
    yarn lint:fix
    yarn format
    ```
