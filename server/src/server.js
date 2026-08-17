import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import playlistRoutes from './routes/playlistsRoutes.js';
import _models, { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import festaRoutes from './routes/festaRoutes.js';
import evolutionRoutes from './routes/evolutionapiRoutes.js';
import eventoEspacoRoutes from './routes/eventoEspacoRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import perfilFamiliarRoutes from './routes/perfilFamiliarRoutes.js';
import { iniciarAgendadorNotificacoes } from './jobs/agendadorNotificacoes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/festa', festaRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/eventos-espaco', eventoEspacoRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/familias', perfilFamiliarRoutes);

app.get('/*splat', (_req, res) => {

 res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));

});



async function LigarServidor() {
  try {
    console.log('[DB] Autenticando conexao...');
    await sequelize.authenticate();
    console.log('[DB] Autenticado. Sincronizando tabelas...');
    // Cria as tabelas no banco se elas ainda nao existirem (nao dropa dados)
    await sequelize.sync();
    const colunasUsuario = await sequelize.getQueryInterface().describeTable('usuarios');
    if (!colunasUsuario.fotoUrl) {
      await sequelize.getQueryInterface().addColumn('usuarios', 'fotoUrl', {
        type: (await import('sequelize')).DataTypes.STRING,
        allowNull: true
      });
      console.log('[DB] Coluna usuarios.fotoUrl criada.');
    }
    // FK opcional convidado -> usuario (tabela ja existente em producao)
    const colunasConvidado = await sequelize.getQueryInterface().describeTable('convidadosFesta');
    if (!colunasConvidado.id_usuario) {
      await sequelize.getQueryInterface().addColumn('convidadosFesta', 'id_usuario', {
        type: (await import('sequelize')).DataTypes.INTEGER,
        allowNull: true
      });
      console.log('[DB] Coluna convidadosFesta.id_usuario criada.');
    }
    if (!colunasConvidado.id_dependente) {
      await sequelize.getQueryInterface().addColumn('convidadosFesta', 'id_dependente', {
        type: (await import('sequelize')).DataTypes.INTEGER,
        allowNull: true
      });
    }
    if (!colunasConvidado.id_responsavel_familiar) {
      await sequelize.getQueryInterface().addColumn('convidadosFesta', 'id_responsavel_familiar', {
        type: (await import('sequelize')).DataTypes.INTEGER,
        allowNull: true
      });
    }
    console.log('[DB] Tabelas sincronizadas.');
    iniciarAgendadorNotificacoes();
    app.listen(port, () => {
      console.info(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error('[DB] ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

LigarServidor();
