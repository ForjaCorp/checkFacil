import cron from 'node-cron';
import { Op } from 'sequelize';

import models from '../models/index.js';
import { enviarLembreteDadosIncompletos } from '../services/whatsappService.js';

const DIAS_ANTECEDENCIA = 7;
const INTERVALO_LEMBRETE_MS = 7 * 24 * 60 * 60 * 1000; // max 1 lembrete/semana por festa
const MAX_TENTATIVAS = 3;

/**
 * Checklist de "dados incompletos" da festa.
 * Retorna lista de pendencias legiveis pro cliente ou [] se tudo ok.
 */
async function calcularPendencias(festa) {
  const pendencias = [];

  if (!festa.pacote_escolhido) {
    pendencias.push('Pacote da festa ainda nao foi escolhido');
  }
  if (!festa.horario_inicio || !festa.horario_fim) {
    pendencias.push('Horario da festa incompleto');
  }

  if (festa.numero_convidados_contratado) {
    const totalConvidados = await models.ConvidadoFesta.count({
      where: { id_festa: festa.id }
    });
    if (totalConvidados < festa.numero_convidados_contratado) {
      pendencias.push(
        `Lista de convidados: ${totalConvidados} de ${festa.numero_convidados_contratado} cadastrados`
      );
    }
  } else {
    pendencias.push('Numero de convidados nao informado');
  }

  return pendencias;
}

/**
 * Passo 1 — agenda lembretes:
 * festas nos proximos 7 dias, com dados incompletos, sem lembrete recente.
 */
async function agendarLembretesDadosIncompletos() {
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + DIAS_ANTECEDENCIA * 24 * 60 * 60 * 1000);
  const hojeStr = hoje.toISOString().slice(0, 10);
  const limiteStr = limite.toISOString().slice(0, 10);

  const festas = await models.Festa.findAll({
    where: {
      data_festa: { [Op.between]: [hojeStr, limiteStr] },
      status: { [Op.notIn]: ['CONCLUIDA', 'CANCELADA'] }
    },
    include: [{ model: models.Usuario, as: 'organizador' }]
  });

  let agendadas = 0;
  for (const festa of festas) {
    const cliente = festa.organizador;
    if (!cliente?.telefone) continue;

    const pendencias = await calcularPendencias(festa);
    if (pendencias.length === 0) continue;

    // Idempotencia: existe lembrete PENDENTE ou ENVIADA ha menos de 7 dias pra esta festa?
    const recentes = await models.NotificacaoAgendada.findOne({
      where: {
        tipo: 'DADOS_INCOMPLETOS',
        id_festa: festa.id,
        status: { [Op.in]: ['PENDENTE', 'ENVIADA'] },
        [Op.or]: [
          { enviado_em: { [Op.gte]: new Date(Date.now() - INTERVALO_LEMBRETE_MS) } },
          { enviado_em: null }
        ]
      }
    });
    if (recentes) continue;

    await models.NotificacaoAgendada.create({
      tipo: 'DADOS_INCOMPLETOS',
      id_festa: festa.id,
      id_destinatario: cliente.id,
      agendado_para: new Date()
    });
    agendadas += 1;
  }

  if (agendadas > 0) {
    console.log(`[cron] ${agendadas} lembrete(s) de dados incompletos agendado(s).`);
  }
}

/** Passo 2 — processa a fila: envia as PENDENTES vencidas via WhatsApp. */
async function processarFilaNotificacoes() {
  const pendentes = await models.NotificacaoAgendada.findAll({
    where: {
      status: 'PENDENTE',
      agendado_para: { [Op.lte]: new Date() },
      tentativas: { [Op.lt]: MAX_TENTATIVAS }
    },
    limit: 20
  });

  for (const notificacao of pendentes) {
    try {
      if (notificacao.tipo === 'DADOS_INCOMPLETOS') {
        const festa = await models.Festa.findByPk(notificacao.id_festa, {
          include: [{ model: models.Usuario, as: 'organizador' }]
        });

        // Festa sumiu/cancelou/concluiu no intervalo: cancela o lembrete
        if (
          !festa ||
          ['CONCLUIDA', 'CANCELADA'].includes(festa.status) ||
          !festa.organizador?.telefone
        ) {
          notificacao.status = 'CANCELADA';
          await notificacao.save();
          continue;
        }

        const pendencias = await calcularPendencias(festa);
        if (pendencias.length === 0) {
          notificacao.status = 'CANCELADA'; // cliente completou os dados a tempo
          await notificacao.save();
          continue;
        }

        await enviarLembreteDadosIncompletos({
          nomeCliente: festa.organizador.nome,
          telefoneCliente: festa.organizador.telefone,
          nomeFesta: festa.nome_festa,
          dataFesta: festa.data_festa,
          pendencias,
          idFesta: festa.id
        });
      }

      notificacao.status = 'ENVIADA';
      notificacao.enviado_em = new Date();
      notificacao.erro = null;
      await notificacao.save();
    } catch (error) {
      notificacao.tentativas += 1;
      notificacao.erro = String(error.message || error).slice(0, 500);
      // Esgotou tentativas: marca FALHOU pra nao rodar pra sempre
      if (notificacao.tentativas >= MAX_TENTATIVAS) {
        notificacao.status = 'FALHOU';
      }
      await notificacao.save();
      console.error(
        `[cron] Notificacao #${notificacao.id} falhou (tentativa ${notificacao.tentativas}):`,
        notificacao.erro
      );
    }
  }
}

async function executarCiclo() {
  try {
    await agendarLembretesDadosIncompletos();
    await processarFilaNotificacoes();
  } catch (error) {
    // Nunca derruba o processo: o proximo ciclo tenta de novo
    console.error('[cron] Erro no ciclo de notificacoes:', error.message);
  }
}

/**
 * Inicia o agendador diario (09:00 America/Fortaleza).
 * Em dev, roda um ciclo imediato ao subir pra validar rapido.
 */
export function iniciarAgendadorNotificacoes() {
  const tarefa = cron.schedule('0 9 * * *', executarCiclo, {
    timezone: 'America/Fortaleza'
  });

  console.log('[cron] Agendador de notificacoes ativo (diario 09:00 America/Fortaleza).');
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(executarCiclo, 5000);
  }

  return tarefa;
}
