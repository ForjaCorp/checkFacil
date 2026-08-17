import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Dependente extends Model {
  static associate(models) {
    this.belongsToMany(models.ResponsavelFamiliar, {
      through: models.ResponsavelDependente,
      foreignKey: 'id_dependente',
      otherKey: 'id_responsavel',
      as: 'responsaveis'
    });
  }
}

Dependente.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    data_nascimento: { type: DataTypes.DATEONLY, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    necessidades_recorrentes: { type: DataTypes.JSON, allowNull: true },
    necessidades_revisadas_em: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: 'Dependente', tableName: 'dependentes', timestamps: true }
);

export default Dependente;
