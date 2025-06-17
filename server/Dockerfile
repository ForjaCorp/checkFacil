# Imagem base leve com Node.js
FROM node:22-alpine

# Diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência para cache mais eficiente
COPY package.json yarn.lock ./

# Instala dependências
RUN yarn install --frozen-lockfile

# Copia todo o restante do projeto
COPY . .

# Expõe a porta usada pela API (ajuste se for diferente)
EXPOSE 3001

# Comando de inicialização
CMD ["node", "src/server.js"]
