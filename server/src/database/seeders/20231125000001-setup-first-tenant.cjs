'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Criar a empresa 'Espaço Criar' (ID 1)
    const empresas = await queryInterface.sequelize.query(
      `SELECT id FROM empresas WHERE id = 1;`
    );

    if (empresas[0].length === 0) {
      await queryInterface.bulkInsert('empresas', [{
        id: 1,
        nome_fantasia: 'Espaço Criar',
        slug: 'espacocriar',
        configuracoes_json: JSON.stringify({
          theme: {
            primary: '#FF5733',
            logo: '/logo-espaco-criar.png'
          },
          modulos: {
            playlists: true,
            gestao_festas: true
          }
        }),
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    // 2. VINCULAR TUDO O QUE EXISTE AO TENANT 1
    
    await queryInterface.sequelize.query(
      `UPDATE usuarios SET tenant_id = 1 WHERE tenant_id IS NULL;`
    );
    
    await queryInterface.sequelize.query(
      `UPDATE festas SET tenant_id = 1 WHERE tenant_id IS NULL;`
    );

    await queryInterface.sequelize.query(
      `UPDATE playlists SET tenant_id = 1 WHERE tenant_id IS NULL;`
    );

    // ✅ Vincular Convidados
    await queryInterface.sequelize.query(
      `UPDATE convidadosFesta SET tenant_id = 1 WHERE tenant_id IS NULL;`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('empresas', { id: 1 }, {});
  }
};