import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const TIPOS_CONVIDADO = {
  ADULTO_PAGANTE: 'ADULTO_PAGANTE',
  CRIANCA_PAGANTE: 'CRIANCA_PAGANTE',
  CRIANCA_ATE_1_ANO: 'CRIANCA_ATE_1_ANO',
  BABA: 'BABA',
  ANFITRIAO_FAMILIA_DIRETA: 'ANFITRIAO_FAMILIA_DIRETA',
  ACOMPANHANTE_ATIPICO: 'ACOMPANHANTE_ATIPICO'
};

class ConvidadoFesta extends Model {
  static associate(models) {
    // Um ConvidadoFesta pertence a uma Festa
    this.belongsTo(models.Festa, {
      foreignKey: 'id_festa',
      as: 'festa'
    });
  }
}

ConvidadoFesta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    id_festa: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nome_convidado: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idade_convidado: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tipo_convidado: {
      type: DataTypes.ENUM(...Object.values(TIPOS_CONVIDADO)),
      allowNull: false
    },
    confirmou_presenca: {
      type: DataTypes.ENUM('PENDENTE', 'SIM', 'NAO'),
      allowNull: true,
      defaultValue: 'PENDENTE'
    },
    checkin_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkout_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    observacao_convidado: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nascimento_convidado: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    e_crianca_atipica: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    telefone_convidado: {
      type: DataTypes.STRING(25),
      allowNull: true
    },

    // ✅ Novas colunas adicionadas:
    // teste
    nome_responsavel_contato: {
      type: DataTypes.STRING,
      allowNull: true
    },
    telefone_responsavel_contato: {
      type: DataTypes.STRING,
      allowNull: true
    },
    acompanhado_por_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'convidadosFesta',
        key: 'id'
      }
    },
    cadastrado_na_hora:{
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    modelName: 'ConvidadoFesta',
    tableName: 'convidadosFesta',
    timestamps: true
  }
);


ConvidadoFesta.TIPOS_CONVIDADO = TIPOS_CONVIDADO;

export default ConvidadoFesta;
