'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Criar a tabela 'Empresas'
      await queryInterface.createTable('empresas', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        nome_fantasia: {
          type: Sequelize.STRING,
          allowNull: false
        },
        slug: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        configuracoes_json: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: {} 
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        }
      }, { transaction });

      // 2. Adicionar 'tenant_id' em 'usuarios'
      await queryInterface.addColumn('usuarios', 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empresas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // 3. Adicionar 'tenant_id' em 'festas'
      await queryInterface.addColumn('festas', 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empresas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // 4. Adicionar 'tenant_id' em 'playlists'
      await queryInterface.addColumn('playlists', 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empresas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // 5. ✅ Adicionar 'tenant_id' em 'convidadosFesta'
      await queryInterface.addColumn('convidadosFesta', 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empresas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // 6. ✅ Excluir a tabela lixo 'convidados' (Se existir)
      // Usamos um try/catch simples aqui caso a tabela já não exista em alguns ambientes
      try {
        await queryInterface.dropTable('convidados', { transaction });
      } catch (e) {
        console.log('Tabela convidados não existia ou já foi apagada.');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('convidadosFesta', 'tenant_id', { transaction });
      await queryInterface.removeColumn('playlists', 'tenant_id', { transaction });
      await queryInterface.removeColumn('festas', 'tenant_id', { transaction });
      await queryInterface.removeColumn('usuarios', 'tenant_id', { transaction });
      await queryInterface.dropTable('empresas', { transaction });
      
      // Nota: Não recriamos a tabela 'convidados' porque ela era lixo.
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};