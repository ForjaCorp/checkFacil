import express from 'express';
import * as eventoEspacoController from '../controllers/eventoEspacoController.js';
import { permitirApenas, verificarTokenJWT } from '../middleware/validarReqAuth.js';
import models from '../models/index.js';

const router = express.Router();

const apenasAdmEspaco = [
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO)
];

// Cliente logado: ve so eventos publicados
router.get('/', verificarTokenJWT, eventoEspacoController.listarEventosPublicados);

// Gestao (adm do espaco)
router.get('/admin', ...apenasAdmEspaco, eventoEspacoController.listarTodosEventos);
router.post('/', ...apenasAdmEspaco, eventoEspacoController.uploadImagemEvento.single('imagem'), eventoEspacoController.criarEvento);
router.put('/:id', ...apenasAdmEspaco, eventoEspacoController.uploadImagemEvento.single('imagem'), eventoEspacoController.atualizarEvento);
router.delete('/:id', ...apenasAdmEspaco, eventoEspacoController.excluirEvento);
router.post('/:id/publicar', ...apenasAdmEspaco, eventoEspacoController.alternarPublicacao);

export default router;
