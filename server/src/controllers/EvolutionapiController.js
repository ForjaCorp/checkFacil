import axios from 'axios';
import { recriarInstanciaWhatsApp } from '../services/whatsappService.js';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
// .trim() porque a env pode vir com espacos acidentais (ex: " Espaco")
const INSTANCE_NAME = (process.env.EVOLUTION_INSTANCE_NAME || 'CheckFacil').trim();

const evoApi = axios.create({
  baseURL: EVO_URL,
  headers: {
    'apikey': EVO_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

function logErroEvolution(acao, error) {
  const status = error.response?.status;
  const corpo = typeof error.response?.data === 'string'
    ? error.response.data
    : JSON.stringify(error.response?.data || {});
  console.error(
    `[Evolution] Falha em ${acao} [instancia "${INSTANCE_NAME}"]:` +
    (status ? ` HTTP ${status} - ${corpo.slice(0, 300)}` : ` ${error.code || error.message}`)
  );
}

export async function getStatus(req, res) {
  try {
    const response = await evoApi.get(`/instance/connectionState/${INSTANCE_NAME}`);
    return res.status(200).json(response.data);
  } catch (error) {
    logErroEvolution('connectionState', error);
    return res.status(500).json({
      error: 'Erro na Evolution API',
      instancia: INSTANCE_NAME,
      detalhe: error.response?.status
        ? `HTTP ${error.response.status}`
        : (error.code || error.message)
    });
  }
}

export async function connectInstance(req, res) {
  try {
    const response = await evoApi.get(`/instance/connect/${INSTANCE_NAME}`);
    return res.status(200).json(response.data);
  } catch (error) {
    logErroEvolution('connect', error);
    return res.status(500).json({
      error: 'Erro ao gerar QR Code',
      instancia: INSTANCE_NAME,
      detalhe: error.response?.status
        ? `HTTP ${error.response.status}`
        : (error.code || error.message)
    });
  }
}

export async function logoutInstance(req, res) {
  try {
    await evoApi.delete(`/instance/logout/${INSTANCE_NAME}`);
    return res.status(200).json({ message: 'Desconectado com sucesso' });
  } catch (error) {
    logErroEvolution('logout', error);
    return res.status(500).json({ error: 'Erro ao desconectar' });
  }
}

/**
 * Reset completo: desloga, deleta e recria a instancia com o mesmo nome e
 * token (apikey). Resolve sessoes travadas ("Connection Closed" eterno).
 * Devolve o QR Code pra escanear. Requer EVOLUTION_GLOBAL_KEY no ambiente.
 */
export async function resetInstance(req, res) {
  try {
    const resultado = await recriarInstanciaWhatsApp();
    return res.status(200).json(resultado);
  } catch (error) {
    logErroEvolution('reset', error);
    return res.status(error.code === 'EVO_SEM_GLOBAL_KEY' ? 400 : 502).json({
      error: error.message,
      etapas: error.etapas || []
    });
  }
}
