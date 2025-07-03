# =================================================================
# Estágio 1: Builder
# O objetivo deste estágio é instalar todas as dependências e
# construir os arquivos estáticos do frontend (client).
# =================================================================
FROM node:22-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Ativa o Corepack para que o Yarn v4 funcione corretamente
RUN corepack enable

# --- Otimização de Cache do Docker ---
# Copiamos os arquivos de manifesto de dependências PRIMEIRO.
# O Docker só vai re-executar 'yarn install' se estes arquivos mudarem.
# Isso acelera muito os builds subsequentes.
COPY package.json yarn.lock .yarnrc.yml* ./

# Instala TODAS as dependências do monorepo de forma otimizada
RUN yarn install --immutable


# Agora que as dependências estão instaladas, copia o resto do código-fonte
COPY . .

# Constrói o build de produção do cliente (Vite)
RUN yarn workspace @checkfacil/client vite build

# =================================================================
# Estágio 2: Imagem Final de Produção
# Esta imagem será leve e conterá apenas o necessário para rodar
# a aplicação em produção.
# =================================================================
FROM node:22-alpine

# Define o diretório de trabalho
WORKDIR /app

# Ativa o Corepack para que 'yarn workspace' funcione na imagem final
RUN corepack enable

# Copia apenas os artefatos estritamente necessários do estágio 'builder'.
# NÃO copiamos o código-fonte do cliente, apenas o seu build (a pasta 'dist').
# Isso mantém a imagem final pequena e segura.
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Expõe a porta que a nossa aplicação no servidor Express usa
EXPOSE 3001

# Comando para iniciar o servidor em produção.
CMD ["yarn", "workspace", "@checkfacil/server", "start"]
