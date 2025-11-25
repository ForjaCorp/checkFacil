import 'dotenv/config'; // Sintaxe correta para ES Modules
import { Sequelize } from 'sequelize';

const dbConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  timezone: '-03:00',
};

// Cria a instância para a aplicação usar
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

export default sequelize;