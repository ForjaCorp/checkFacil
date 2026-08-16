import express from 'express';
import * as controller from '../controllers/perfilFamiliarController.js';
import { verificarTokenPerfilFamiliar } from '../middleware/validarPerfilFamiliar.js';

const router = express.Router();
router.post('/otp/solicitar', controller.solicitarOtp);
router.post('/otp/validar', controller.validarOtp);
router.get('/me', verificarTokenPerfilFamiliar, controller.buscarMeuPerfil);
router.put('/me', verificarTokenPerfilFamiliar, controller.atualizarMeuPerfil);
router.delete('/me', verificarTokenPerfilFamiliar, controller.excluirMeuPerfil);
router.post('/me/dependentes', verificarTokenPerfilFamiliar, controller.adicionarDependente);
router.put('/me/dependentes/:id', verificarTokenPerfilFamiliar, controller.atualizarDependente);

export default router;
