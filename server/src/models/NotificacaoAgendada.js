import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Fila de notificacoes agendadas (lembretes via WhatsApp, etc).
 * Processada pelo job diario (node-cron) — ver src/jobs/agendadorNotificacoes.js
 */
class NotificacaoAgendada extends Model {}

NotificacaoAgendada.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM('DADOS_INCOMPLETOS'),
      allowNull: false
    },
    id_festa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'festas', key: 'id' }
    },
    id_destinatario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' }
    },
    agendado_para: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('PENDENTE', 'ENVIADA', 'FALHOU', 'CANCELADA'),
      allowNull: false,
      defaultValue: 'PENDENTE'
    },
    enviado_em: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tentativas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    erro: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'NotificacaoAgendada',
    tableName: 'notificacoes_agendadas',
    timestamps: true
  }
);

export default NotificacaoAgendada;
