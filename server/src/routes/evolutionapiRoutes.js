import express from 'express';
// ✅ CORRIGIDO: Nome do arquivo com 'E' maiúsculo conforme você criou
import { getStatus, connectInstance, logoutInstance } from '../controllers/EvolutionapiController.js';
// Ajuste o nome aqui se no seu projeto for 'verificarTokenJWT'
import { verificarTokenJWT, isAdminEspaco } from '../middleware/validarReqAuth.js';

const router = express.Router();

// Aplica a proteção globalmente para este arquivo
router.use(verificarTokenJWT, isAdminEspaco);

router.get('/status', getStatus);
router.get('/connect', connectInstance);
router.post('/logout', logoutInstance);

export default router;