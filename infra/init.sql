-- ============================================================
--  CheckFácil - Script de criação do schema do banco MySQL
--  Gerado a partir dos models Sequelize (server/src/models/)
--
--  Uso:
--    Este script é de referência. Em ambientes novos (Coolify,
--    Docker, etc.) o sequelize.sync() cria as tabelas automaticamente
--    na primeira inicialização do servidor.
--
--    Para criar manualmente:
--      mysql -u root -p < init.sql
--      (ou cole no phpMyAdmin / DBeaver / MySQL Workbench)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  Tabela: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`                         INT AUTO_INCREMENT PRIMARY KEY,
  `telefone`                   VARCHAR(255) NULL,
  `nome`                       VARCHAR(255) NOT NULL,
  `email`                      VARCHAR(255) NOT NULL UNIQUE,
  `senha`                      VARCHAR(255) NOT NULL,
  `tipoUsuario`                ENUM('Adm_espaco', 'Adm_festa', 'Convidado') NOT NULL DEFAULT 'Convidado',
  `redefineSenhaToken`         VARCHAR(255) NULL,
  `redefineSenhaExpiracao`     DATETIME NULL,
  `createdAt`                  DATETIME NOT NULL,
  `updatedAt`                  DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Tabela: festas
-- ============================================================
CREATE TABLE IF NOT EXISTS `festas` (
  `id`                               INT AUTO_INCREMENT PRIMARY KEY,
  `nome_festa`                       VARCHAR(255) NOT NULL,
  `data_festa`                       DATE NOT NULL,
  `horario_inicio`                   TIME NULL,
  `horario_fim`                      TIME NULL,
  `local_festa`                      VARCHAR(255) NULL,
  `descricao`                        TEXT NULL,
  `pacote_escolhido`                 ENUM('KIDS','KIDS_MAIS_PARK','PLAY','PLAY_MAIS_PARK','KIDS_PARK_PLAY') NULL,
  `numero_convidados_contratado`     INT NOT NULL DEFAULT 0,
  `nome_aniversariante`              VARCHAR(255) NULL,
  `idade_aniversariante`             INT NULL,
  `tema_festa`                       VARCHAR(255) NULL,
  `festa_deixa_e_pegue`              TINYINT(1) NULL,
  `autoriza_uso_imagem`              TINYINT(1) NULL,
  `instagram_cliente`                VARCHAR(100) NULL,
  `procedimento_convidado_fora_lista` ENUM('PERMITIR_ANOTAR','CHAMAR_ANFITRIAO') NULL,
  `link_playlist_spotify`            VARCHAR(255) NULL,
  `observacoes_festa`                TEXT NULL,
  `id_organizador`                   INT NOT NULL,
  `status`                           ENUM('RASCUNHO','AGUARDANDO_CLIENTE','PRONTA','EM_ANDAMENTO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'RASCUNHO',
  `link_convite`                     VARCHAR(255) NULL,
  `decorador_nome`                   VARCHAR(255) NULL,
  `decorador_contato`                VARCHAR(255) NULL,
  `tem_material_terceirizado`        TINYINT(1) NULL DEFAULT 0,
  `material_terceirizado_contato`    VARCHAR(255) NULL,
  `local_decoracao`                  ENUM('PLAY','CASINHAS','ENTRE_CASINHAS','KIDS','SALAO_DE_FESTAS') NULL,
  `buffet_nome`                      VARCHAR(255) NULL,
  `buffet_contato`                   VARCHAR(255) NULL,
  `bebidas_fornecedor_nome`          VARCHAR(255) NULL,
  `bebidas_fornecedor_contato`       VARCHAR(255) NULL,
  `fornecedor_extra_nome`            VARCHAR(255) NULL,
  `fornecedor_extra_contato`         VARCHAR(255) NULL,
  `createdAt`                        DATETIME NOT NULL,
  `updatedAt`                        DATETIME NOT NULL,
  CONSTRAINT `fk_festas_organizador`
    FOREIGN KEY (`id_organizador`) REFERENCES `usuarios` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Tabela: convidadosFesta
--  (auto-relacionamento: acompanhado_por_id -> própria tabela)
-- ============================================================
CREATE TABLE IF NOT EXISTS `convidadosFesta` (
  `id`                          INT AUTO_INCREMENT PRIMARY KEY,
  `id_festa`                    INT NOT NULL,
  `nome_convidado`              VARCHAR(255) NOT NULL,
  `idade_convidado`             INT NULL,
  `tipo_convidado`              ENUM('ADULTO_PAGANTE','CRIANCA_PAGANTE','CRIANCA_ATE_1_ANO','BABA','ANFITRIAO_FAMILIA_DIRETA','ACOMPANHANTE_ATIPICO') NOT NULL,
  `confirmou_presenca`          ENUM('PENDENTE','SIM','NAO') NULL DEFAULT 'PENDENTE',
  `checkin_at`                  DATETIME NULL,
  `checkout_at`                 DATETIME NULL,
  `observacao_convidado`        TEXT NULL,
  `nascimento_convidado`        DATE NULL,
  `e_crianca_atipica`           TINYINT(1) NULL DEFAULT 0,
  `telefone_convidado`          VARCHAR(25) NULL,
  `nome_responsavel_contato`    VARCHAR(255) NULL,
  `telefone_responsavel_contato` VARCHAR(255) NULL,
  `acompanhado_por_id`          INT NULL,
  `cadastrado_na_hora`          TINYINT(1) NULL DEFAULT NULL,
  `createdAt`                   DATETIME NOT NULL,
  `updatedAt`                   DATETIME NOT NULL,
  CONSTRAINT `fk_convidados_festa`
    FOREIGN KEY (`id_festa`) REFERENCES `festas` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_convidados_responsavel`
    FOREIGN KEY (`acompanhado_por_id`) REFERENCES `convidadosFesta` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Tabela: playlists
-- ============================================================
CREATE TABLE IF NOT EXISTS `playlists` (
  `id`     INT AUTO_INCREMENT PRIMARY KEY,
  `nome`   VARCHAR(255) NOT NULL,
  `link`   VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
