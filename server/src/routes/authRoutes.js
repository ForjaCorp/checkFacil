import express from 'express';
import * as authController from '../controllers/authController.js';
import { validarLogin, validarRegistro, permitirApenas, verificarTokenJWT } from '../middleware/validarReqAuth.js';
import models from '../models/index.js';

const router = express.Router();

router.post('/register/convidado', verificarTokenJWT ,permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO),validarRegistro, authController.registrarConvidado);

router.post('/register/admEspaco', verificarTokenJWT, permitirApenas(models.Usuario.TIPOS_USUARIO.ADM_ESPACO) ,validarRegistro, authController.registrarAdmEspaco);

router.post('/register/admFesta', validarRegistro, authController.registrarAdmFesta);

router.post('/login', validarLogin, authController.login);

router.post('/definir-senha', authController.definirSenha);

export default router;
