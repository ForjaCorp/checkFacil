import { Sequelize } from 'sequelize';
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

// Cria o database se ele nao existir (usando Sequelize sem database)
export async function ensureDatabase() {
  console.log(`[DB] Tentando criar database "${dbName}" em ${dbHost}...`);
  const sequelizeInit = new Sequelize('', dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    logging: false
  });
  await sequelizeInit.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await sequelizeInit.close();
  console.log(`[DB] Database "${dbName}" garantido com sucesso.`);
}

export default sequelize;
