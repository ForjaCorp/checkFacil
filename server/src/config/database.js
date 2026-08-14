import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'nome_do_banco';
const dbUser = process.env.DB_USER || 'usuario_do_banco';
const dbPassword = process.env.DB_PASSWORD || 'senha_do_banco';
const dbHost = process.env.DB_HOST || 'localhost';

// Conecta sem especificar o database para poder cria-lo se necessario
const sequelizeInit = new Sequelize('mysql', dbUser, dbPassword, {
  host: dbHost,
  dialect: 'mysql',
  logging: false,
  timezone: '-03:00'
});

// Conexao principal usada pela aplicacao
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'mysql',
  logging: false,
  timezone: '-03:00'
});

// Cria o database se ele nao existir
export async function ensureDatabase() {
  await sequelizeInit.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await sequelizeInit.close();
}

export default sequelize;
