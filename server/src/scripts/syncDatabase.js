import 'dotenv/config';
import { sequelize } from '../models/index.js';

/**
 * Cria/atualiza as tabelas no banco conforme os models Sequelize.
 * Uso: yarn workspace @checkfacil/server sync
 *
 * --alter (opcional): tenta ajustar colunas existentes para baterem
 * com os models. Nao dropa tabelas nem dados.
 *   yarn workspace @checkfacil/server sync --alter
 */
const usarAlter = process.argv.includes('--alter');

try {
  await sequelize.authenticate();
  console.log('[sync] Conectado ao banco. Sincronizando tabelas...');

  await sequelize.sync({ alter: usarAlter });

  console.log('[sync] Tabelas sincronizadas com sucesso.');
  await sequelize.close();
  process.exit(0);
} catch (error) {
  console.error('[sync] ERRO:', error.message);
  await sequelize.close().catch(() => {});
  process.exit(1);
}
