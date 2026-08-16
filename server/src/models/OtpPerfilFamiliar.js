import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OtpPerfilFamiliar extends Model {}

OtpPerfilFamiliar.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    telefone_normalizado: { type: DataTypes.STRING(25), allowNull: false },
    id_festa: { type: DataTypes.INTEGER, allowNull: false },
    codigo_hash: { type: DataTypes.STRING(64), allowNull: false },
    expira_em: { type: DataTypes.DATE, allowNull: false },
    usado_em: { type: DataTypes.DATE, allowNull: true },
    tentativas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ip_solicitante: { type: DataTypes.STRING(64), allowNull: true }
  },
  {
    sequelize,
    modelName: 'OtpPerfilFamiliar',
    tableName: 'otpPerfisFamiliares',
    timestamps: true,
    indexes: [{ fields: ['telefone_normalizado', 'createdAt'] }]
  }
);

export default OtpPerfilFamiliar;
