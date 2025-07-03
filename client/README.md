# CheckFacil - Aplicação Cliente (Frontend)

Bem-vindo ao workspace do cliente do CheckFacil. Esta é uma Aplicação Web Progressiva (PWA) construída com Vite, React e TypeScript, responsável por toda a interface de usuário do sistema.

## ✨ Tecnologias Utilizadas

- **Framework & Build:** [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/)
- **Validação de Dados:** [Zod](https://zod.dev/)
- **Comunicação com API:** [Axios](https://axios-http.com/)
- **Roteamento:** [React Router DOM](https://reactrouter.com/)

## ⚙️ Configuração

### Pré-requisitos

- Todas as dependências da raiz do monorepo devem ser instaladas primeiro (`yarn install` na raiz).

## 🚀 Scripts Disponíveis

Os scripts devem ser executados a partir da **raiz do monorepo**.

- **Para rodar o cliente em modo de desenvolvimento:**

  ```bash
  # Inicia o servidor de desenvolvimento do Vite com Hot Reload
  yarn dev:client
  ```

- **Para build de produção:**

  ```bash
  # Gera os arquivos otimizados para produção na pasta /client/dist
  yarn workspace @checkfacil/client build
  ```

## 🎨 Estrutura de Pastas

A estrutura de pastas do cliente segue padrões bem definidos para escalabilidade:

- **/src/components:** Componentes de UI reutilizáveis.
  - **/ui:** Componentes base gerados pelo `shadcn/ui`.
  - **/events, /guests:** Componentes específicos de cada feature.
- **/src/pages:** Componentes que representam as páginas da aplicação.
- **/src/hooks:** Hooks customizados para reutilização de lógica (ex: `useApiMutation`).
- **/src/contexts:** Contextos React para gerenciamento de estado global (ex: `AuthContext`).
- **/src/schemas:** Schemas de validação do Zod para os formulários.
- **/src/services:** Configuração e comunicação com a API (ex: instância do Axios).
- **/src/types:** Definições de tipos e interfaces globais da aplicação.
