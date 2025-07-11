import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const TIPOS_PACOTE_FESTA = {
  KIDS: 'KIDS',
  KIDS_MAIS_PARK: 'KIDS_MAIS_PARK',
  PLAY: 'PLAY',
  PLAY_MAIS_PARK: 'PLAY_MAIS_PARK',
  SUPER_FESTA_COMPLETA: 'SUPER_FESTA_COMPLETA'
};

class Festa extends Model {
  static associate(models) {
    this.belongsTo(models.Usuario, {
      foreignKey: 'id_organizador',
      as: 'organizador'
    });

    this.hasMany(models.ConvidadoFesta, {
      foreignKey: 'id_festa',
      as: 'convidados'
    });
  }
}

Festa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nome_festa: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data_festa: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    horario_inicio: { type: DataTypes.TIME, allowNull: true },
    horario_fim: { type: DataTypes.TIME, allowNull: true },
    local_festa: { type: DataTypes.STRING, allowNull: true },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    pacote_escolhido: {
      type: DataTypes.ENUM(
        TIPOS_PACOTE_FESTA.KIDS,
        TIPOS_PACOTE_FESTA.KIDS_MAIS_PARK,
        TIPOS_PACOTE_FESTA.PLAY,
        TIPOS_PACOTE_FESTA.PLAY_MAIS_PARK,
        TIPOS_PACOTE_FESTA.SUPER_FESTA_COMPLETA
      ),
      allowNull: true
    },
    numero_adultos_contratado: { type: DataTypes.INTEGER, allowNull: true },
    numero_criancas_contratado: { type: DataTypes.INTEGER, allowNull: true },
    nome_aniversariante: { type: DataTypes.STRING, allowNull: true },
    idade_aniversariante: { type: DataTypes.INTEGER, allowNull: true },
    tema_festa: { type: DataTypes.STRING, allowNull: true },
    festa_deixa_e_pegue: { type: DataTypes.BOOLEAN, allowNull: true },
    autoriza_uso_imagem: { type: DataTypes.BOOLEAN, allowNull: true },
    instagram_cliente: { type: DataTypes.STRING(100), allowNull: true },
    procedimento_convidado_fora_lista: {
      type: DataTypes.ENUM('PERMITIR_ANOTAR', 'CHAMAR_ANFITRIAO'),
      allowNull: true
    },
    link_playlist_spotify: { type: DataTypes.STRING, allowNull: true },
    observacoes_festa: { type: DataTypes.TEXT, allowNull: true },
    id_organizador: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'RASCUNHO',
        'AGUARDANDO_CLIENTE',
        'PRONTA',
        'EM_ANDAMENTO',
        'CONCLUIDA',
        'CANCELADA'
      ),
      allowNull: false,
      defaultValue: 'RASCUNHO'
    },
    link_convite: {
      type: DataTypes.STRING,
      allowNull: true
    }

    

  },
  {
    sequelize,
    modelName: 'Festa',
    tableName: 'festas',
    timestamps: true
  }
);

Festa.TIPOS_PACOTE_FESTA = TIPOS_PACOTE_FESTA;

export default Festa;
