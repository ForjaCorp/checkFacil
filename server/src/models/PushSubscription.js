import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Inscricao de Web Push por dispositivo/navegador.
 * Uma pessoa pode ter varias inscricoes (celular, tablet, desktop).
 */
class PushSubscription extends Model {}

PushSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // URL unica do servico push por dispositivo/navegador
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // Chaves de criptografia da inscricao (p256dh e auth)
    p256dh: {
      type: DataTypes.STRING,
      allowNull: false
    },
    auth: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'PushSubscription',
    tableName: 'push_subscriptions',
    timestamps: true
  }
);

export default PushSubscription;
