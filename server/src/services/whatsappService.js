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
  },
  timeout: 15000
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
 * Classifica o erro da Evolution API em um tipo conhecido, com mensagem
 * amigavel pra aparecer no log do servidor.
 *
 * Codigos:
 *  - TELEFONE_INVALIDO  : formato de telefone nao reconhecido
 *  - EVO_CONFIG         : EVOLUTION_API_URL/KEY nao configuradas
 *  - EVO_CONEXAO        : servidor da Evolution inacessivel / timeout
 *  - EVO_API_KEY        : apikey invalida (401)
 *  - EVO_INSTANCIA      : instancia nao encontrada (404)
 *  - EVO_DESCONECTADO   : instancia existe mas o WhatsApp nao esta conectado
 *  - EVO_ERRO           : outro erro retornado pela Evolution
 */
function classificarErro(error, telefoneOriginal) {
  const err = new Error();
  err.telefone = telefoneOriginal;

  // Telefone invalido (detectado antes da chamada)
  if (error.code === 'TELEFONE_INVALIDO') {
    err.code = 'TELEFONE_INVALIDO';
    err.message = `Telefone com formato invalido: "${telefoneOriginal}". Use DDD + numero (ex: 79 99112-2334).`;
    return err;
  }

  // Config ausente
  if (!EVO_URL || !EVO_KEY) {
    err.code = 'EVO_CONFIG';
    err.message = `EVOLUTION_API_URL ou EVOLUTION_API_KEY nao configuradas no ambiente.`;
    return err;
  }

  // Sem resposta do servidor (DNS, conexao recusada, timeout)
  if (!error.response) {
    const motivo =
      error.code === 'ECONNABORTED'
        ? 'timeout (15s)'
        : error.code || error.message;
    err.code = 'EVO_CONEXAO';
    err.message = `Sem conexao com a Evolution API (${EVO_URL}): ${motivo}. Verifique se o servidor esta no ar.`;
    return err;
  }

  // Evolution respondeu com erro HTTP
  const status = error.response.status;
  const corpo = typeof error.response.data === 'string'
    ? error.response.data
    : JSON.stringify(error.response.data || {});
  const detalhe = corpo.slice(0, 300);

  if (status === 401) {
    err.code = 'EVO_API_KEY';
    err.message = `apikey invalida ou expirada (HTTP 401). Revise a env EVOLUTION_API_KEY.`;
  } else if (status === 404) {
    err.code = 'EVO_INSTANCIA';
    err.message = `Instancia "${INSTANCE_NAME}" nao encontrada na Evolution API (HTTP 404). Revise a env EVOLUTION_INSTANCE_NAME.`;
  } else if (/not\s+(found|connected)|connection\s+refused|whatsapp.*not.*connect/i.test(corpo)) {
    err.code = 'EVO_DESCONECTADO';
    err.message = `Instancia "${INSTANCE_NAME}" existe mas o WhatsApp nao esta conectado. Escaneie o QR Code no painel da Evolution.`;
  } else {
    err.code = 'EVO_ERRO';
    err.message = `Evolution API respondeu HTTP ${status}: ${detalhe}`;
  }

  err.detalhe = detalhe;
  err.status = status;
  return err;
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a Evolution API.
 *
 * @param {string} telefone - Telefone de destino (qualquer formato BR)
 * @param {string} mensagem - Texto da mensagem
 * @returns {Promise<object>} - Resposta da Evolution API
 * @throws {Error} com .code classificado (ver classificarErro)
 */
export async function enviarMensagemWhatsApp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone);

  if (!numero) {
    throw classificarErro({ code: 'TELEFONE_INVALIDO' }, telefone);
  }

  try {
    const response = await evoApi.post(`/message/sendText/${INSTANCE_NAME}`, {
      number: numero,
      text: mensagem,
      options: {
        delay: 1200,
        presence: 'composing'
      }
    });
    return response.data;
  } catch (error) {
    throw classificarErro(error, telefone);
  }
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
