import express from 'express';
import * as festaController from '../controllers/festaController.js';
import { verificarTokenJWT } from '../middleware/validarReqAuth.js';
import { uploadConvite } from '../middleware/uploadConvite.js';
import { uploadImagemConvite } from '../controllers/festaController.js';

const router = express.Router();

// Rota pública: Cadastro em grupo de convidados (sem token)
router.post('/:idFesta/register-guest-group', festaController.registrarGrupoConvidados);

// POST /festa/criar -> Cria uma nova festa
router.post('/criar', verificarTokenJWT, festaController.criarFesta);

// GET /festa/listar -> Lista festas com base nas permissões e filtros.
// Esta rota mais específica vem ANTES da rota genérica /:idFesta.
router.get('/listar', verificarTokenJWT, festaController.buscarFestas);

// GET /festa/:idFesta -> Busca uma festa específica por ID.
router.get('/:idFesta', verificarTokenJWT, festaController.buscarFestaPorId);

// GET /festa/:idFesta/public -> Rota pública para a página de seleção de fluxo do convidado.
router.get('/:idFesta/public', festaController.buscarFestaPublicaPorId);

// POST /festa/:idFesta/register-adults -> Rota pública para o fluxo de confirmação de adultos.
router.post('/:idFesta/register-adults', festaController.registrarAdultos);

// PATCH /festa/:idFesta -> Atualiza uma festa específica.
router.patch('/:idFesta', verificarTokenJWT, festaController.atualizarFesta);

// DELETE /festa/:idFesta -> Deleta uma festa específica.
router.delete('/:idFesta', verificarTokenJWT, festaController.deletarFesta);

// --- ROTAS PARA CONVIDADOS DE UMA FESTA ---

// GET /festa/:idFesta/convidados -> Lista todos os convidados.
router.get('/:idFesta/convidados', verificarTokenJWT, festaController.listarConvidadosDaFesta);

// GET /festa/:idFesta/convidados/buscar -> Busca convidados por nome.
router.get(
  '/:idFesta/convidados/buscar',
  verificarTokenJWT,
  festaController.buscarConvidadosPorNome
);

router.get(
  '/:id/convidados/download',
  verificarTokenJWT,
  festaController.downloadConvidados
);

// POST /festa/:idFesta/disparar-mensagem -> Dispara mensagens no WhatsApp para convidados presentes.
router.post(
  '/:idFesta/disparar-mensagem',
  verificarTokenJWT,
  festaController.dispararMensagem
);


// GET /festa/:idFesta/convidados/:idConvidado -> Busca um convidado específico por ID.
router.get(
  '/:idFesta/convidados/:idConvidado',
  verificarTokenJWT,
  festaController.buscarConvidadoPorId
);

// PATCH /festa/:idFesta/convidados/:idConvidado -> Atualiza um convidado.
router.patch(
  '/:idFesta/convidados/:idConvidado',
  verificarTokenJWT,
  festaController.atualizarConvidado
);

// DELETE /festa/:idFesta/convidados/:idConvidado -> Deleta um convidado.
router.delete(
  '/:idFesta/convidados/:idConvidado',
  verificarTokenJWT,
  festaController.deletarConvidado
);

// PATCH /festa/:idFesta/convidados/:idConvidado/checkin -> Realiza o check-in.
router.patch(
  '/:idFesta/convidados/:idConvidado/checkin',
  verificarTokenJWT,
  festaController.checkinConvidado
);

// PATCH /festa/:idFesta/convidados/:idConvidado/checkout -> Realiza o check-out.
router.patch(
  '/:idFesta/convidados/:idConvidado/checkout',
  verificarTokenJWT,
  festaController.checkoutConvidado
);

// POST /festa/:idFesta/convidados/:idConvidado/checkin-grupo -> Realiza o check-in em grupo.
router.post(
  '/:idFesta/convidados/:idConvidado/checkin-grupo',
  verificarTokenJWT,
  festaController.checkinGrupo
);

router.post(
  '/:idFesta/convite/upload',
  verificarTokenJWT,
  uploadConvite.single('arquivo'),
  uploadImagemConvite
);



export default router;
