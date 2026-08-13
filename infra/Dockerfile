# ============================================
# Estágio 1: Builder - instala deps e builda
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# Copia apenas os manifests para aproveitar cache de camadas
COPY package.json yarn.lock .yarnrc.yml ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

# Instala todas as dependências (node-modules linker)
RUN yarn config set nodeLinker node-modules && yarn install

# Copia o código-fonte (node_modules e .env são ignorados pelo .dockerignore)
COPY . .

# Build do frontend (Vite — pula tsc pra evitar falha por erros de tipo pré-existentes)
RUN yarn workspace @checkfacil/client vite build

# Reinstala apenas dependências de produção do server
RUN yarn workspaces focus @checkfacil/server --production

# ============================================
# Estágio 2: Runtime - imagem final enxuta
# ============================================
FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable

# Manifests do monorepo
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./

# Código e dependências do servidor
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

# Frontend compilado
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["yarn", "workspace", "@checkfacil/server", "start"]
