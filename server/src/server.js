// server/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import _models, { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import festaRoutes from './routes/festaRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/festa', festaRoutes);

app.get('/*splat', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
});

async function LigarServidor() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('Conexão com o MySQL estabelecida com sucesso.');

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Servidor rodando na porta ${port} em http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados ou iniciar o servidor:', error);
    process.exit(1);
  }
}

LigarServidor();
