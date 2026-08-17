import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ResponsavelDependente extends Model {}

ResponsavelDependente.init(
  {
    id_responsavel: { type: DataTypes.INTEGER, primaryKey: true },
    id_dependente: { type: DataTypes.INTEGER, primaryKey: true },
    parentesco_ou_relacao: { type: DataTypes.STRING(50), allowNull: true },
    pode_editar: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  { sequelize, modelName: 'ResponsavelDependente', tableName: 'responsaveisDependentes', timestamps: true }
);

export default ResponsavelDependente;
