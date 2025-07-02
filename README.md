# CheckFacil - Sistema de Gestão de Eventos

Bem-vindo ao repositório do CheckFacil! Esta é uma Aplicação Web Progressiva (PWA) completa, projetada para otimizar o gerenciamento de festas e eventos, com foco em um processo de check-in e check-out de convidados ágil e seguro.

## Visão Geral da Estrutura

Este projeto é um monorepo gerenciado com **Yarn Workspaces** e **Plug'n'Play (PnP)**. Ele é composto pelos seguintes workspaces:

* **`/client`**: Contém o frontend da aplicação (PWA), responsável pela interface do usuário para o Staff do evento e para os Clientes (organizadores da festa).
* **`/server`**: Contém a API backend, responsável pela lógica de negócios, autenticação, comunicação com o banco de dados e integrações externas.

## ✨ Tecnologias Principais

| Área          | Tecnologia                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo** | [Yarn 4.x](https://yarnpkg.com/) (Workspaces, PnP), [Turborepo](https://turbo.build/repo), [TypeScript](https://www.typescriptlang.org/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/) |
| **Frontend** | [React](https://react.dev/) (Vite), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Sequelize](https://sequelize.org/) (ORM), [MySQL](https://www.mysql.com/), [JWT](https://jwt.io/)                                                  |
| **DevOps** | [Docker](https://www.docker.com/), [Traefik](https://traefik.io/traefik/) (para o ambiente de produção)                                                                                                                  |

## ⚙️ Configuração do Ambiente

### Pré-requisitos

* Node.js `v20.x` ou superior
* Yarn `v4.x` ou superior
* Docker e Docker Compose (para o banco de dados) ou uma instância MySQL local.

### Passos de Instalação

1. **Clone o repositório:**

    ```bash
    git clone https://github.com/ForjaCorp/checkFacil.git
    cd checkFacil
    ```

2. **Instale as dependências:**
    Este comando instalará as dependências da raiz e de todos os workspaces (`client` e `server`).

    ```bash
    yarn install
    ```

3. **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` em cada um dos workspaces e preencha com as informações necessárias.

    * **Backend (`/server/.env`):**

        ```env
        # Banco de Dados
        DB_HOST=localhost
        DB_USER=seu_usuario_mysql
        DB_PASSWORD=sua_senha_mysql
        DB_NAME=checkfacil_db
        DB_PORT=3306

        # JWT (gere um segredo forte)
        JWT_SECRET=seu_segredo_super_secreto_aqui

        # Porta do Servidor
        PORT=3001
        ```

    * **Frontend (`/client/.env`):**

        ```env
        # URL base da API para o cliente se comunicar com o backend
        VITE_API_BASE_URL=http://localhost:3001
        ```

4. **Configuração do Editor (VS Code):**
    Para garantir que o VS Code utilize a versão correta do TypeScript gerenciada pelo Yarn PnP, rode o seguinte comando na raiz do projeto após `yarn install`:

    ```bash
    yarn dlx @yarnpkg/sdks vscode
    ```

    Depois, abra qualquer arquivo `.ts` ou `.tsx`, use o comando `TypeScript: Select TypeScript Version...` (Ctrl+Shift+P) e selecione a **"Use Workspace Version"**.

## 🚀 Execução do Projeto

Todos os comandos devem ser executados a partir da **raiz do monorepo**.

* **Para rodar cliente e servidor simultaneamente (recomendado):**

    ```bash
    yarn dev
    ```

* **Para construir todos os pacotes para produção:**

    ```bash
    yarn build
    ```

O Turborepo gerencia a execução paralela e o cache de tarefas, tornando esses comandos extremamente eficientes.

## Linting e Formatação

A qualidade e a formatação do código são garantidas automaticamente através de um hook de **pre-commit** gerenciado por **Husky** e **Lint-Staged**.

Antes de cada `git commit`, os seguintes comandos são executados **apenas nos arquivos modificados**:

* `eslint --fix`: Corrige automaticamente erros de lint.
* `prettier --write`: Formata o código de acordo com as regras do projeto.

Isso garante que todo o código enviado para o repositório já está padronizado.

Para executar as verificações manualmente em todo o projeto, você pode usar:

* **Verificar Linting:**

    ```bash
    yarn lint
    ```

* **Verificar Formatação com Prettier:**

    ```bash
    yarn format:check
    ```
