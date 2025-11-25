const path = require('path');

// Carrega o .env explicitamente do caminho correto (raiz do server)
// Isso evita erros se o comando for rodado de outra pasta
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

console.log("🔍 Carregando configuração do banco...");
console.log("   -> Host:", process.env.DB_HOST);
console.log("   -> Database:", process.env.DB_NAME);
console.log("   -> Dialect:", process.env.DB_DIALECT || 'mysql');

const dbConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  timezone: '-03:00',
  dialectOptions: {
    // Importante para algumas versões do MySQL/MariaDB remotas
    bigNumberStrings: true
  }
};

// Exportação padrão CommonJS
module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};