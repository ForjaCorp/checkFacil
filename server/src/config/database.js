import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'nome_do_banco';
const dbUser = process.env.DB_USER || 'usuario_do_banco';
const dbPassword = process.env.DB_PASSWORD || 'senha_do_banco';
const dbHost = process.env.DB_HOST || 'localhost';

// Conexao principal usada pela aplicacao
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'mysql',
  logging: false,
  timezone: '-03:00'
});

// Cria o database se ele nao existir (usando mysql2 direto)
export async function ensureDatabase() {
  console.log(`[DB] Tentando criar database "${dbName}" em ${dbHost}...`);
  const conn = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`[DB] Database "${dbName}" garantido com sucesso.`);
  await conn.end();
}

export default sequelize;
