import axios from 'axios';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'CheckFacil';

const FRONT_URL = process.env.FRONT_URL || 'https://espacocriar.4growthbr.space';

const evoApi = axios.create({
  baseURL: EVO_URL,
  headers: {
    apikey: EVO_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Normaliza o telefone pro formato aceito pela Evolution API.
 * Ex: "79911223344" ou "(79) 99112-2334" -> "5579911223344"
 */
function normalizarTelefone(telefone) {
  if (!telefone) return null;
  const digitos = String(telefone).replace(/\D/g, '');

  if (!digitos) return null;

  // Ja tem codigo do pais (55 + 10/11 digitos)
  if (digitos.length >= 12 && digitos.startsWith('55')) {
    return digitos;
  }

  // DDD + numero (10 ou 11 digitos) -> adiciona 55
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }

  return null;
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a Evolution API.
 *
 * @param {string} telefone - Telefone de destino (qualquer formato BR)
 * @param {string} mensagem - Texto da mensagem
 * @returns {Promise<object>} - Resposta da Evolution API
 */
export async function enviarMensagemWhatsApp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone);

  if (!numero) {
    throw new Error(`Telefone invalido: "${telefone}"`);
  }

  const response = await evoApi.post(`/message/sendText/${INSTANCE_NAME}`, {
    number: numero,
    text: mensagem,
    options: {
      delay: 1200,
      presence: 'composing'
    }
  });

  return response.data;
}

/**
 * Envia a mensagem de boas-vindas para um cliente novo com o link
 * de definicao de senha. Substitui o webhook n8n 2cd048a2.
 */
export async function enviarBoasVindasClienteNovo(dados) {
  const {
    nomeCliente,
    telefoneCliente,
    dataFesta,
    horaInicio,
    horaFim,
    localFesta,
    token
  } = dados;

  const dataFormatada = dataFesta
    ? new Date(`${dataFesta}T00:00:00`).toLocaleDateString('pt-BR')
    : 'a definir';

  const linkSenha = `${FRONT_URL}/organizer/choosePassword/${token}`;

  const mensagem = [
    `Ola, ${nomeCliente}! 🎉`,
    '',
    'Sua festa foi agendada no Espaco Criar!',
    '',
    `📅 Data: ${dataFormatada}`,
    horaInicio ? `🕐 Horario: ${horaInicio}${horaFim ? ` as ${horaFim}` : ''}` : null,
    localFesta ? `📍 Local: ${localFesta}` : null,
    '',
    'Para acompanhar sua festa e gerenciar os convidados, defina sua senha no link abaixo:',
    linkSenha,
    '',
    'O link e valido por 24 horas.',
    '',
    'Ate logo! 🎈'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(telefoneCliente, mensagem);
}
