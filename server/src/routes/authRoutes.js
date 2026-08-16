import express from 'express';
import * as authController from '../controllers/authController.js';
import {
  validarLogin,
  validarRegistro,
  permitirApenas,
  verificarTokenJWT
} from '../middleware/validarReqAuth.js';
import models from '../models/index.js';

const router = express.Router();

router.post(
  '/register/convidado',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  validarRegistro,
  authController.registrarConvidado
);

router.post(
  '/register/admEspaco',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  validarRegistro,
  authController.registrarAdmEspaco
);

// Gestao de equipe do espaco (pagina de administradores)
router.get(
  '/adms',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  authController.listarAdmsEspaco
);

router.post(
  '/adms/convidar',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  authController.convidarAdmEspaco
);

router.post(
  '/adms/:id/redefinir-senha',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  authController.reenviarSenhaAdm
);

router.delete(
  '/adms/:id',
  verificarTokenJWT,
  permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),
  authController.excluirAdm
);

router.post('/register/admFesta', validarRegistro, authController.registrarAdmFesta);

router.post('/login', validarLogin, authController.login);

// ✅ AQUI ENTRA A NOVA ROTA
router.post('/forgot-password', authController.solicitarRedefinicaoSenha);

router.get('/me', verificarTokenJWT, authController.validarSessao);

router.put(
  '/me',
  verificarTokenJWT,
  authController.uploadAvatar.single('foto'),
  authController.atualizarPerfil
);

router.post('/definir-senha', authController.definirSenha);

export default router;
