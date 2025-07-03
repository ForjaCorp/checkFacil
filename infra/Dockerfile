# Estágio 1: Builder - Instala dependências e constrói o projeto
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY . .
RUN yarn config set nodeLinker node-modules
RUN yarn install
RUN yarn workspace @checkfacil/client vite build


# Estágio 2: Imagem Final de Produção
FROM node:22-alpine

WORKDIR /app
RUN corepack enable

COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001
CMD ["yarn", "workspace", "@checkfacil/server", "start"]

