import webpush from 'web-push';

import models from '../models/index.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@checkfacil.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function pushConfigurado() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

export function getChavePublica() {
  return VAPID_PUBLIC_KEY || null;
}

/**
 * Envia um push para uma inscricao especifica.
 * Retorna true se enviou, false se a inscricao morreu (e remove do banco).
 */
async function enviarParaInscricao(inscricao, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: inscricao.endpoint,
        keys: { p256dh: inscricao.p256dh, auth: inscricao.auth }
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    // 404/410 = inscricao expirada/cancelada: remove do banco
    if (error.statusCode === 404 || error.statusCode === 410) {
      await models.PushSubscription.destroy({ where: { id: inscricao.id } }).catch(() => {});
    } else {
      console.error('[push] Falha ao enviar para endpoint:', error.statusCode || error.message);
    }
    return false;
  }
}

/**
 * Envia push para destinatarios.
 * @param {object} payload { title, body, url, tag? }
 * @param {object} opcoes
 * @param {number[]} [opcoes.idsUsuario] - usuarios especificos
 * @param {boolean} [opcoes.todosAdmsFesta] - broadcast para todos os clientes (Adm_festa)
 * @returns {Promise<number>} quantidade de envios com sucesso
 */
export async function enviarPush(payload, { idsUsuario, todosAdmsFesta } = {}) {
  if (!pushConfigurado()) {
    console.warn('[push] VAPID nao configurado — envio ignorado.');
    return 0;
  }

  const where = {};
  if (Array.isArray(idsUsuario) && idsUsuario.length > 0) {
    where.id_usuario = idsUsuario;
  } else if (todosAdmsFesta) {
    const clientes = await models.Usuario.findAll({
      where: { tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_FESTA },
      attributes: ['id']
    });
    const ids = clientes.map((c) => c.id);
    if (ids.length === 0) return 0;
    where.id_usuario = ids;
  } else {
    return 0;
  }

  const inscricoes = await models.PushSubscription.findAll({ where });
  const resultados = await Promise.all(inscricoes.map((i) => enviarParaInscricao(i, payload)));
  return resultados.filter(Boolean).length;
}

/** Push padrao de divulgacao de novo evento do espaco. */
export async function enviarPushNovoEvento(evento) {
  return enviarPush(
    {
      title: 'Novo evento no espaço! 🎉',
      body: evento.titulo,
      url: '/organizer/eventos',
      tag: `evento-espaco-${evento.id}`
    },
    { todosAdmsFesta: true }
  );
}
