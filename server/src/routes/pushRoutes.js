import express from 'express';

import models from '../models/index.js';
import { verificarTokenJWT } from '../middleware/validarReqAuth.js';
import { enviarPush, getChavePublica, pushConfigurado } from '../services/pushService.js';

const router = express.Router();

/** Chave publica VAPID pro front inscrever o dispositivo. */
router.get('/chave-publica', (_req, res) => {
  return res.status(200).json({
    chavePublica: getChavePublica(),
    configurado: pushConfigurado()
  });
});

/** Registra (ou atualiza) a inscricao do dispositivo do usuario logado. */
router.post('/inscrever', verificarTokenJWT, async (req, res) => {
  try {
    const { endpoint, keys } = req.body?.subscription ?? {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Assinatura de push inválida.' });
    }
    if (!pushConfigurado()) {
      return res.status(503).json({ error: 'Notificações push não configuradas no servidor.' });
    }

    await models.PushSubscription.upsert({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      id_usuario: req.usuarioId,
      user_agent: req.headers['user-agent'] || null
    });

    return res.status(201).json({ mensagem: 'Notificações ativadas neste dispositivo.' });
  } catch (error) {
    console.error('Erro ao inscrever push:', error);
    return res.status(500).json({ error: 'Erro ao ativar notificações.' });
  }
});

/** Remove a inscricao (usuario desativou ou navegador cancelou). */
router.delete('/inscrever', verificarTokenJWT, async (req, res) => {
  try {
    const { endpoint } = req.body?.subscription ?? {};
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint obrigatório.' });
    }
    await models.PushSubscription.destroy({ where: { endpoint } });
    return res.status(200).json({ mensagem: 'Notificações desativadas neste dispositivo.' });
  } catch (error) {
    console.error('Erro ao remover inscricao push:', error);
    return res.status(500).json({ error: 'Erro ao desativar notificações.' });
  }
});

/** Push de teste para o proprio usuario (valida a ponta a ponta). */
router.post('/teste', verificarTokenJWT, async (req, res) => {
  try {
    const enviados = await enviarPush(
      {
        title: 'Check Fácil 🎈',
        body: 'Notificações ativadas com sucesso!',
        url: '/profile',
        tag: 'teste-push'
      },
      { idsUsuario: [req.usuarioId] }
    );

    if (enviados === 0) {
      return res.status(400).json({ error: 'Nenhum dispositivo inscrito para o seu usuário.' });
    }
    return res.status(200).json({ mensagem: 'Notificação de teste enviada.' });
  } catch (error) {
    console.error('Erro ao enviar push de teste:', error);
    return res.status(500).json({ error: 'Erro ao enviar teste.' });
  }
});

export default router;
