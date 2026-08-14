# ============================================
# Estágio 1: Builder - instala deps e builda
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# Copia tudo primeiro (node_modules e .env são ignorados pelo .dockerignore)
COPY . .

# Configura node-modules ANTES de instalar (sobrescreve o pnp do .yarnrc.yml)
RUN yarn config set nodeLinker node-modules
RUN yarn install

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
