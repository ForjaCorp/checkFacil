import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ResponsavelFamiliar extends Model {
  static associate(models) {
    this.belongsToMany(models.Dependente, {
      through: models.ResponsavelDependente,
      foreignKey: 'id_responsavel',
      otherKey: 'id_dependente',
      as: 'dependentes'
    });
  }
}

ResponsavelFamiliar.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    telefone_normalizado: { type: DataTypes.STRING(25), allowNull: false, unique: true },
    telefone_verificado_em: { type: DataTypes.DATE, allowNull: false },
    consentimento_dados_em: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: 'ResponsavelFamiliar', tableName: 'responsaveisFamiliares', timestamps: true }
);

export default ResponsavelFamiliar;
