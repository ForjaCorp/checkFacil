import 'dotenv/config';
import { DataTypes } from 'sequelize';
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

  // Migração aditiva para a tabela que já existe em produção. Evita
  // depender de `sync --alter`, que pode reescrever outras estruturas.
  const queryInterface = sequelize.getQueryInterface();
  const colunasConvidado = await queryInterface.describeTable('convidadosFesta');
  if (!colunasConvidado.id_dependente) {
    await queryInterface.addColumn('convidadosFesta', 'id_dependente', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    console.log('[sync] Coluna convidadosFesta.id_dependente criada.');
  }
  if (!colunasConvidado.id_responsavel_familiar) {
    await queryInterface.addColumn('convidadosFesta', 'id_responsavel_familiar', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    console.log('[sync] Coluna convidadosFesta.id_responsavel_familiar criada.');
  }

  console.log('[sync] Tabelas sincronizadas com sucesso.');
  await sequelize.close();
  process.exit(0);
} catch (error) {
  console.error('[sync] ERRO:', error.message);
  await sequelize.close().catch(() => {});
  process.exit(1);
}
