import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Eventos abertos/tematicos do espaco (colonia de ferias, dia das maes...).
 * Nao confundir com Festa (festa privada com organizador contratante).
 */
class EventoEspaco extends Model {}

EventoEspaco.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    data_fim: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Caminho relativo da imagem (ex: /uploads/eventos/xxx.png)
    imagem_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Link de compra externo (Sympla)
    link_ingresso: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: { msg: 'O link do ingresso deve ser uma URL válida.' }
      }
    },
    publicado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'EventoEspaco',
    tableName: 'eventos_espaco',
    timestamps: true
  }
);

export default EventoEspaco;
