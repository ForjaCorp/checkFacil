import axios from 'axios';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'CheckFacil';

const evoApi = axios.create({
  baseURL: EVO_URL,
  headers: {
    'apikey': EVO_KEY,
    'Content-Type': 'application/json'
  }
});

export async function getStatus(req, res) {
  try {
    const response = await evoApi.get(`/instance/connectionState/${INSTANCE_NAME}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro na Evolution API', details: error.message });
  }
}

export async function connectInstance(req, res) {
  try {
    const response = await evoApi.get(`/instance/connect/${INSTANCE_NAME}`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
}

export async function logoutInstance(req, res) {
  try {
    await evoApi.delete(`/instance/logout/${INSTANCE_NAME}`);
    return res.status(200).json({ message: 'Desconectado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desconectar' });
  }
}