import axios from 'axios';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
// .trim() porque a env pode vir com espacos acidentais (ex: " Espaco")
const INSTANCE_NAME = (process.env.EVOLUTION_INSTANCE_NAME || 'CheckFacil').trim();

const FRONT_URL = process.env.FRONT_URL || 'https://espacocriar.4growthbr.space';

// Apikey GLOBAL (admin) do servidor Evolution - necessaria para criar/deletar instancias.
// Sem ela, o reset automatico nao funciona (so o painel da Evolution consegue).
const EVO_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY;

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
 * Exportada para os controllers gravarem no banco no mesmo padrao.
 */
export function normalizarTelefone(telefone) {
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
    'O link e valido por 48 horas.',
    '',
    'Apos definir sua senha, entre com seu telefone e complete os dados da festa (aniversariante, tema, convidados e mais) no painel.',
    '',
    'Ate logo! 🎈'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(telefoneCliente, mensagem);
}

/**
 * Confirma o check-in de um convidado para o responsavel.
 * Substitui o webhook n8n ab98ae95.
 */
export async function enviarCheckinConvidado(dados) {
  const { nomeConvidado, horarioCheckin } = dados;

  const horaFormatada = horarioCheckin
    ? new Date(horarioCheckin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const mensagem = [
    '✅ Check-in realizado!',
    '',
    `${nomeConvidado} acabou de entrar na festa.`,
    horaFormatada ? `🕐 Entrada às ${horaFormatada}.` : null,
    '',
    'Bom divertimento! 🎉'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(dados.telefoneResponsavel, mensagem);
}

/**
 * Confirma o check-out de um convidado para o responsavel.
 * Substitui o webhook n8n 730bdcaf.
 */
export async function enviarCheckoutConvidado(dados) {
  const { nomeConvidado, horarioCheckin, horarioCheckout } = dados;

  const horaEntrada = horarioCheckin
    ? new Date(horarioCheckin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const horaSaida = horarioCheckout
    ? new Date(horarioCheckout).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const mensagem = [
    '👋 Check-out realizado!',
    '',
    `${nomeConvidado} acabou de sair da festa.`,
    horaEntrada ? `🕐 Entrada: ${horaEntrada}` : null,
    horaSaida ? `🕐 Saída: ${horaSaida}` : null,
    '',
    'Obrigado por comparecer! 🎈'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(dados.telefoneResponsavel, mensagem);
}

/**
 * Notifica um cliente JA cadastrado sobre uma nova festa criada para ele.
 * Substitui o webhook n8n 642999e9.
 */
export async function enviarNovaFestaClienteExistente(dados) {
  const {
    nomeCliente,
    telefoneCliente,
    dataFesta,
    horaInicio,
    horaFim,
    localFesta
  } = dados;

  const dataFormatada = dataFesta
    ? new Date(`${dataFesta}T00:00:00`).toLocaleDateString('pt-BR')
    : 'a definir';

  const mensagem = [
    `Ola, ${nomeCliente}! 🎉`,
    '',
    'Sua proxima festa ja esta agendada no Espaco Criar!',
    '',
    `📅 Data: ${dataFormatada}`,
    horaInicio ? `🕐 Horario: ${horaInicio}${horaFim ? ` as ${horaFim}` : ''}` : null,
    localFesta ? `📍 Local: ${localFesta}` : null,
    '',
    'Confirme e complete os dados da festa no painel (aniversariante, tema, convidados e mais). Entre com seu telefone e senha no link abaixo:',
    FRONT_URL,
    '',
    'Se esqueceu sua senha, use a opcao "Esqueci minha senha" na tela de login.',
    '',
    'Ate a festa! 🎈'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(telefoneCliente, mensagem);
}

/**
 * Reenvia o link de definicao de senha a pedido do Adm_espaco
 * (quando o original expirou ou o cliente nao recebeu).
 */
export async function enviarReenvioLinkSenha(dados) {
  const { nomeCliente, telefoneCliente, token } = dados;

  const linkSenha = `${FRONT_URL}/organizer/choosePassword/${token}`;

  const mensagem = [
    `Ola, ${nomeCliente}!`,
    '',
    'Reenviamos o link para voce definir sua senha no Espaco Criar:',
    linkSenha,
    '',
    'O link e valido por 48 horas.',
    '',
    'Apos definir sua senha, entre com seu telefone e complete os dados da sua festa no painel.',
    '',
    'Se nao foi voce quem pediu, ignore esta mensagem.'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(telefoneCliente, mensagem);
}

/**
 * Convida um novo Adm_espaco: link de definicao de senha via WhatsApp.
 * Mesmo padrao do cliente novo, adaptado para a equipe.
 */
export async function enviarConviteAdmEspaco(dados) {
  const { nomeAdm, telefoneAdm, token } = dados;

  const linkSenha = `${FRONT_URL}/organizer/choosePassword/${token}`;

  const mensagem = [
    `Ola, ${nomeAdm}!`,
    '',
    'Voce foi cadastrado(a) como administrador(a) do Espaco Criar no Check Facil!',
    '',
    'Defina sua senha no link abaixo para acessar o painel:',
    linkSenha,
    '',
    'O link e valido por 48 horas.',
    '',
    'Apos definir sua senha, entre com seu telefone ou e-mail.',
    '',
    'Se nao foi voce quem pediu, ignore esta mensagem.'
  ]
    .filter((linha) => linha !== null)
    .join('\n');

  return enviarMensagemWhatsApp(telefoneAdm, mensagem);
}

/**
 * Reset completo da instancia WhatsApp: desloga, deleta e recria com o
 * MESMO nome e MESMO token (apikey continua valida, nada muda no .env).
 * Devolve o QR Code pro usuario escanear.
 *
 * Usado quando a sessao Baileys "trava" (state connecting eterno,
 * "Connection Closed" em todo envio e nem o logout funciona).
 *
 * Requer EVOLUTION_GLOBAL_KEY no ambiente (apikey admin do servidor
 * Evolution) porque criar/deletar instancia nao aceita o token da
 * propria instancia.
 */
export async function recriarInstanciaWhatsApp() {
  if (!EVO_GLOBAL_KEY) {
    const err = new Error(
      'EVOLUTION_GLOBAL_KEY nao configurada no servidor. Essa e a apikey GLOBAL (admin) do painel da Evolution, necessaria para recriar a instancia.'
    );
    err.code = 'EVO_SEM_GLOBAL_KEY';
    throw err;
  }

  const etapas = [];

  // Cliente com a apikey global
  const evoAdmin = axios.create({
    baseURL: EVO_URL,
    headers: { apikey: EVO_GLOBAL_KEY, 'Content-Type': 'application/json' },
    timeout: 30000
  });

  // 1. Logout limpo (se a sessao estiver morta, falha e seguimos mesmo assim)
  try {
    await evoAdmin.delete(`/instance/logout/${INSTANCE_NAME}`);
    etapas.push('logout: ok');
  } catch (e) {
    etapas.push('logout: falhou (sessao possivelmente morta) - continuando');
  }

  // 2. Deletar a instancia corrompida
  try {
    await evoAdmin.delete(`/instance/delete/${INSTANCE_NAME}`);
    etapas.push('delete: ok');
  } catch (error) {
    const status = error.response?.status;
    const err = new Error(
      `Nao foi possivel deletar a instancia "${INSTANCE_NAME}" (HTTP ${status ?? 'sem resposta'}). ` +
        'Verifique se o servidor Evolution permite delecao via API (env DEL_INSTANCE=TRUE) ou delete manualmente pelo painel.'
    );
    err.code = 'EVO_DELETE_FALHOU';
    err.etapas = etapas;
    throw err;
  }

  // 3. Recriar com o MESMO nome e MESMO token (apikey atual continua valendo)
  try {
    await evoAdmin.post('/instance/create', {
      instanceName: INSTANCE_NAME,
      token: EVO_KEY,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
    etapas.push('recriacao: ok');
  } catch (error) {
    const status = error.response?.status;
    const err = new Error(
      `Nao foi possivel recriar a instancia "${INSTANCE_NAME}" (HTTP ${status ?? 'sem resposta'}). ` +
        'Confira a EVOLUTION_GLOBAL_KEY (precisa ser a apikey global/admin) e crie manualmente pelo painel com o mesmo nome e token.'
    );
    err.code = 'EVO_CREATE_FALHOU';
    err.etapas = etapas;
    throw err;
  }

  // 4. Gera o QR Code pra escanear
  try {
    const response = await evoAdmin.get(`/instance/connect/${INSTANCE_NAME}`);
    const qrcode = response.data.base64 || response.data.qrcode?.base64 || null;
    etapas.push('qrcode: gerado');
    return { qrcode, etapas };
  } catch (error) {
    const err = new Error(
      'Instancia recriada, mas falhou ao gerar o QR Code. Gere manualmente no painel da Evolution.'
    );
    err.code = 'EVO_QR_FALHOU';
    err.etapas = etapas;
    throw err;
  }
}
