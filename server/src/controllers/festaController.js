import models, { sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import excel from 'exceljs';
import {
  enviarBoasVindasClienteNovo,
  enviarNovaFestaClienteExistente,
  enviarCheckinConvidado,
  enviarCheckoutConvidado,
  enviarReenvioLinkSenha,
  enviarMensagemWhatsApp
} from '../services/whatsappService.js';


function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

// --- Funções de Festa (criar, buscar, atualizar, deletar) ---
// Nenhuma alteração necessária aqui, mantidas como no original.

export async function criarFesta(req, res) {
  const { dadosFesta, dadosCliente } = req.body;

  if (!dadosFesta || !dadosCliente || !dadosCliente.email || !dadosFesta.nome_festa) {
    return res
      .status(400)
      .json({ error: 'Dados da festa e do cliente (com nome e email) são obrigatórios.' });
  }

  try {
    let clienteOrganizador = await models.Usuario.findOne({ where: { email: dadosCliente.email } });
    let isNovoCliente = false;

    if (!clienteOrganizador) {
      isNovoCliente = true;

      clienteOrganizador = await models.Usuario.create({
        nome: dadosCliente.nome,
        email: dadosCliente.email,
        telefone: dadosCliente.telefone,
        tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_FESTA,
        senha: randomBytes(16).toString('hex')
      });

      const tokenDefinicaoSenha = randomBytes(20).toString('hex');
      const expiracao = new Date();
      expiracao.setHours(expiracao.getHours() + 48); // Token válido por 48h

      clienteOrganizador.redefineSenhaToken = tokenDefinicaoSenha;
      clienteOrganizador.redefineSenhaExpiracao = expiracao;
      await clienteOrganizador.save();

      // Envia boas-vindas + link de definicao de senha direto pela Evolution API
      // (substitui o webhook n8n 2cd048a2)
      try {
        await enviarBoasVindasClienteNovo({
          nomeCliente: clienteOrganizador.nome,
          telefoneCliente: clienteOrganizador.telefone,
          dataFesta: dadosFesta.data_festa,
          horaInicio: dadosFesta.horario_inicio,
          horaFim: dadosFesta.horario_fim,
          localFesta: dadosFesta.local_festa,
          token: tokenDefinicaoSenha
        });
        console.log(`[WhatsApp] Boas-vindas enviada para ${clienteOrganizador.telefone}`);
      } catch (whatsappError) {
        // Log com classificacao do erro (TELEFONE_INVALIDO, EVO_CONEXAO, EVO_API_KEY, etc.)
        console.error(
          `[WhatsApp] Falha ao enviar boas-vindas [${whatsappError.code || 'ERRO_DESCONHECIDO'}]:`,
          whatsappError.message
        );
        if (whatsappError.detalhe) {
          console.error('[WhatsApp] Detalhe da Evolution API:', whatsappError.detalhe);
        }
      }
    } else {
      // Cliente JA cadastrado: notifica a nova festa direto pela Evolution API
      // (substitui o webhook n8n 642999e9)
      try {
        await enviarNovaFestaClienteExistente({
          nomeCliente: clienteOrganizador.nome,
          telefoneCliente: clienteOrganizador.telefone,
          dataFesta: dadosFesta.data_festa,
          horaInicio: dadosFesta.horario_inicio,
          horaFim: dadosFesta.horario_fim,
          localFesta: dadosFesta.local_festa
        });
        console.log(`[WhatsApp] Notificacao de nova festa enviada para ${clienteOrganizador.telefone}`);
      } catch (whatsappError) {
        console.error(
          `[WhatsApp] Falha ao notificar nova festa [${whatsappError.code || 'ERRO_DESCONHECIDO'}]:`,
          whatsappError.message
        );
        if (whatsappError.detalhe) {
          console.error('[WhatsApp] Detalhe da Evolution API:', whatsappError.detalhe);
        }
      }
    }

    const { numero_criancas_contratado, numero_adultos_contratado, ...dadosFestaAtualizados } =
      dadosFesta;

    if (dadosFestaAtualizados.numero_convidados_contratado === undefined) {
      const totalGuests = (numero_criancas_contratado || 0) + (numero_adultos_contratado || 0);
      if (totalGuests > 0) {
        dadosFestaAtualizados.numero_convidados_contratado = totalGuests;
      }
    }

    const novaFesta = await models.Festa.create({
      ...dadosFestaAtualizados,
      id_organizador: clienteOrganizador.id
    });

    const festaCompleta = await models.Festa.findByPk(novaFesta.id, {
      include: [
        {
          model: models.Usuario,
          as: 'organizador',
          attributes: ['id', 'nome', 'email', 'telefone']
        }
      ]
    });

    return res.status(201).json({
      festa: festaCompleta,
      isNovoCliente: isNovoCliente,
      mensagem: isNovoCliente
        ? 'Cliente e festa criados com sucesso. Mensagem de boas-vindas a ser enviada.'
        : 'Festa criada e associada a um cliente existente com sucesso.'
    });
  } catch (error) {
    console.error('Erro no fluxo de criar festa:', error);
    if (error.name === 'SequelizeValidationError') {
      return res
        .status(400)
        .json({ error: 'Dados inválidos.', detalhes: error.errors.map((e) => e.message) });
    }
    return res.status(500).json({ error: 'Falha ao processar a criação da festa.' });
  }
}

export async function buscarFestas(req, res) {
  try {
    const { usuarioId, usuarioTipo } = req;
    const { data, data_inicio, data_fim, search, status, page = 1, limit = 20 } = req.query;

    let whereClause = {};

    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      whereClause.id_organizador = usuarioId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (data) {
      whereClause.data_festa = data;
    } else if (data_inicio && data_fim) {
      whereClause.data_festa = { [Op.between]: [data_inicio, data_fim] };
    }

    if (search) {
      whereClause[Op.or] = [
        { nome_festa: { [Op.like]: `%${search}%` } },
        { nome_aniversariante: { [Op.like]: `%${search}%` } },
        { '$organizador.nome$': { [Op.like]: `%${search}%` } }
      ];
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: festas } = await models.Festa.findAndCountAll({
      where: whereClause,
      limit: parsedLimit,
      offset: offset,
      include: [
        {
          model: models.Usuario,
          as: 'organizador',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['data_festa', 'DESC']]
    });

    const totalPages = Math.ceil(count / parsedLimit);
    const response = {
      totalItems: count,
      totalPages: totalPages,
      currentPage: parsedPage,
      festas: festas
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao listar festas:', error);
    return res.status(500).json({ error: 'Falha ao listar festas.' });
  }
}

export async function atualizarFesta(req, res) {
  try {
    const { idFesta } = req.params;
    const dadosAtualizados = req.body;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Você não tem permissão para atualizar esta festa.' });
    }

    const { numero_criancas_contratado, numero_adultos_contratado, ...dadosAtualizadosLimpos } =
      dadosAtualizados;

    if (
      dadosAtualizadosLimpos.numero_convidados_contratado === undefined &&
      (numero_criancas_contratado !== undefined || numero_adultos_contratado !== undefined)
    ) {
      const totalGuests = (numero_criancas_contratado || 0) + (numero_adultos_contratado || 0);
      if (totalGuests > 0) {
        dadosAtualizadosLimpos.numero_convidados_contratado = totalGuests;
      }
    }

    await festa.update(dadosAtualizadosLimpos);

    return res.status(200).json(festa);
  } catch (error) {
    console.error('Erro ao atualizar festa:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res
        .status(400)
        .json({ error: 'Dados inválidos para atualizar festa.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Falha ao atualizar a festa.' });
  }
}

export async function deletarFesta(req, res) {
  try {
    const { idFesta } = req.params;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Você não tem permissão para deletar esta festa.' });
    }

    // Remove os convidados junto (nao ha cascade no banco) dentro de uma transacao
    await sequelize.transaction(async (t) => {
      await models.ConvidadoFesta.destroy({ where: { id_festa: festa.id }, transaction: t });
      await festa.destroy({ transaction: t });
    });

    return res.status(200).json({ mensagem: 'Festa deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar festa:', error);
    return res.status(500).json({ error: 'Falha ao deletar a festa.' });
  }
}

/**
 * Reenvia o link de definicao de senha do organizador da festa via WhatsApp.
 * Uso do Adm_espaco quando o link original expirou (48h) ou o cliente nao recebeu.
 */
export async function reenviarLinkSenha(req, res) {
  const { idFesta } = req.params;
  const { usuarioTipo } = req;

  try {
    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      return res
        .status(403)
        .json({ error: 'Apenas administradores do espaco podem reenviar o link de senha.' });
    }

    const festa = await models.Festa.findByPk(idFesta, {
      include: [{ model: models.Usuario, as: 'organizador' }]
    });
    if (!festa || !festa.organizador) {
      return res.status(404).json({ error: 'Festa ou organizador nao encontrado.' });
    }

    const organizador = festa.organizador;
    if (!organizador.telefone) {
      return res.status(400).json({
        error: 'O organizador desta festa nao tem telefone cadastrado.'
      });
    }

    // Gera um token novo (invalida o anterior) com validade de 48h
    const token = randomBytes(20).toString('hex');
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 48);

    organizador.redefineSenhaToken = token;
    organizador.redefineSenhaExpiracao = expiracao;
    await organizador.save();

    await enviarReenvioLinkSenha({
      nomeCliente: organizador.nome,
      telefoneCliente: organizador.telefone,
      token
    });

    return res
      .status(200)
      .json({ mensagem: `Link de senha reenviado para ${organizador.telefone}.` });
  } catch (error) {
    console.error(
      `[WhatsApp] Falha ao reenviar link de senha [${error.code || 'ERRO_DESCONHECIDO'}]:`,
      error.message
    );
    return res.status(502).json({
      error:
        error.message ||
        'Falha ao enviar o WhatsApp. Verifique a conexao do WhatsApp e tente novamente.'
    });
  }
}

// --- Funções de Convidados ---

// ========================================================================
// AQUI COMEÇA A FUNÇÃO CORRIGIDA
// ========================================================================
export async function registrarGrupoConvidados(req, res) {
  const { idFesta } = req.params;
  const { contatoResponsavel, convidados, cadastrado_na_hora = false } = req.body;
  
  // --- NOVA VALIDAÇÃO DE SEGURANÇA ---
  // Verifica se os dados essenciais foram enviados.
  if (!contatoResponsavel || !contatoResponsavel.nome || !contatoResponsavel.telefone) {
    return res.status(400).json({ error: 'Os dados de contato do responsável são obrigatórios.' });
  }
  if (!Array.isArray(convidados) || convidados.length === 0) {
    return res.status(400).json({ error: 'A lista de convidados não pode estar vazia.' });
  }

  const transaction = await sequelize.transaction();

  try {
    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Festa não encontrada.' });
    }

    let responsavelId = null;
    const convidadosSalvos = [];
    
    // PASSO 1: Encontrar e criar o responsável PRIMEIRO (se ele estiver na lista de convidados)
    const responsavelData = convidados.find(c => !c.tipo_convidado.startsWith('CRIANCA'));
    
    if (responsavelData) {
      const novoResponsavel = await models.ConvidadoFesta.create(
        {
          id_festa: idFesta,
          nome_convidado: responsavelData.nome_convidado,
          tipo_convidado: responsavelData.tipo_convidado,
          nascimento_convidado: responsavelData.nascimento_convidado || null,
          idade_convidado: responsavelData.nascimento_convidado
            ? calcularIdade(responsavelData.nascimento_convidado)
            : null,
          e_crianca_atipica: responsavelData.e_crianca_atipica || false,
          telefone_convidado: contatoResponsavel.telefone,
          nome_responsavel_contato: contatoResponsavel.nome,
          telefone_responsavel_contato: contatoResponsavel.telefone,
          cadastrado_na_hora: cadastrado_na_hora,
          acompanhado_por_id: null
        },
        { transaction }
      );
      
      responsavelId = novoResponsavel.id; 
      convidadosSalvos.push(novoResponsavel);
    }

    // PASSO 2: Agora, criar as crianças e VINCULAR ao responsável (se ele foi salvo)
    const criancasData = convidados.filter(c => c.tipo_convidado.startsWith('CRIANCA'));

    for (const crianca of criancasData) {
      const novaCrianca = await models.ConvidadoFesta.create(
        {
          id_festa: idFesta,
          nome_convidado: crianca.nome_convidado,
          tipo_convidado: crianca.tipo_convidado,
          nascimento_convidado: crianca.nascimento_convidado || null,
          idade_convidado: crianca.nascimento_convidado
            ? calcularIdade(crianca.nascimento_convidado)
            : null,
          e_crianca_atipica: crianca.e_crianca_atipica || false,
          telefone_convidado: null,
          nome_responsavel_contato: contatoResponsavel.nome, // Agora seguro, pois validamos no início
          telefone_responsavel_contato: contatoResponsavel.telefone,
          cadastrado_na_hora: cadastrado_na_hora,
          acompanhado_por_id: responsavelId // Será o ID do pai ou null, corretamente
        },
        { transaction }
      );
      
      convidadosSalvos.push(novaCrianca);
    }

    await transaction.commit();

    return res.status(201).json({
      mensagem: 'Grupo de convidados cadastrado com sucesso.',
      convidados: convidadosSalvos
    });

  } catch (error) {
    console.error('Erro ao registrar grupo:', error);
    await transaction.rollback();

    if (error.name === 'SequelizeValidationError') {
      const detalhes = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Erro de validação.', detalhes });
    }

    return res.status(500).json({ error: 'Erro interno ao registrar grupo.' });
  }
}

export async function checkinGrupoConvidados(req, res) {
  // O id do convidado aqui é o ID do RESPONSÁVEL pelo grupo
  const { idFesta, idConvidado } = req.params;
  const { usuarioTipo } = req;

  // Inicia uma transação para garantir a integridade dos dados
  const transaction = await sequelize.transaction();

  try {
    // Apenas o staff do espaço pode realizar o check-in
    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ error: 'Acesso negado. Apenas o staff do espaço pode realizar o check-in.' });
    }

    // PASSO 1: Encontrar o responsável E todos os seus filhos de uma vez só.
    // Usamos o [Op.or] para pegar o convidado cujo 'id' é o do responsável,
    // OU todos os convidados cujo 'acompanhado_por_id' é o do responsável.
    const grupoParaCheckin = await models.ConvidadoFesta.findAll({
      where: {
        id_festa: idFesta,
        [Op.or]: [
          { id: idConvidado },
          { acompanhado_por_id: idConvidado }
        ]
      }
    }, { transaction });

    // Se não encontrarmos ninguém (nem o responsável), retornamos um erro.
    if (!grupoParaCheckin || grupoParaCheckin.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Grupo de convidados não encontrado.' });
    }

    const agora = new Date();
    const convidadosAtualizados = [];

    // PASSO 2: Fazer o check-in de cada membro do grupo que ainda não entrou.
    for (const convidado of grupoParaCheckin) {
      if (!convidado.checkin_at) { // Só faz check-in se a pessoa ainda não entrou
        convidado.checkin_at = agora;
        await convidado.save({ transaction }); // Salva a alteração dentro da transação
      }
      convidadosAtualizados.push(convidado);
    }
    
    // PASSO 3: Se tudo correu bem, confirma todas as alterações no banco.
    await transaction.commit();

    // Opcional: Disparar um webhook ou outra notificação aqui, se necessário.

    return res.status(200).json({ 
      mensagem: `Check-in realizado para ${convidadosAtualizados.length} membro(s) do grupo.`, 
      convidados: convidadosAtualizados 
    });

  } catch (error) {
    // PASSO 4: Se qualquer coisa der errado, desfaz todas as alterações.
    await transaction.rollback();
    console.error('Erro ao realizar check-in em grupo:', error);
    return res.status(500).json({ error: 'Falha ao realizar check-in em grupo.' });
  }
}


export async function checkoutGrupoConvidados(req, res) {
  // O id do convidado aqui é o ID do RESPONSÁVEL pelo grupo
  const { idFesta, idConvidado } = req.params;
  const { usuarioTipo } = req;

  // Inicia uma transação para garantir a integridade dos dados
  const transaction = await sequelize.transaction();

  try {
    // Apenas o staff do espaço pode realizar o check-out
    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ error: 'Acesso negado. Apenas o staff do espaço pode realizar o check-out.' });
    }

    // PASSO 1: Encontrar o responsável E todos os seus filhos de uma vez só.
    const grupoParaCheckout = await models.ConvidadoFesta.findAll({
      where: {
        id_festa: idFesta,
        [Op.or]: [
          { id: idConvidado },
          { acompanhado_por_id: idConvidado }
        ]
      }
    }, { transaction });

    // Se não encontrarmos ninguém (nem o responsável), retornamos um erro.
    if (!grupoParaCheckout || grupoParaCheckout.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Grupo de convidados não encontrado.' });
    }

    const agora = new Date();
    const convidadosAtualizados = [];

    // PASSO 2: Fazer o check-out de cada membro do grupo que já entrou e ainda não saiu.
    for (const convidado of grupoParaCheckout) {
      // A condição chave: SÓ faz check-out se a pessoa JÁ FEZ check-in E AINDA NÃO FEZ check-out.
      if (convidado.checkin_at && !convidado.checkout_at) { 
        convidado.checkout_at = agora;
        await convidado.save({ transaction }); // Salva a alteração dentro da transação
      }
      convidadosAtualizados.push(convidado);
    }
    
    // PASSO 3: Se tudo correu bem, confirma todas as alterações no banco.
    await transaction.commit();

    // Opcional: Disparar um webhook ou outra notificação aqui, se necessário.

    return res.status(200).json({ 
      mensagem: `Check-out realizado para o grupo.`, 
      convidados: convidadosAtualizados 
    });

  } catch (error) {
    // PASSO 4: Se qualquer coisa der errado, desfaz todas as alterações.
    await transaction.rollback();
    console.error('Erro ao realizar check-out em grupo:', error);
    return res.status(500).json({ error: 'Falha ao realizar check-out em grupo.' });
  }
}

export async function registrarAdultos(req, res) {
  const { idFesta } = req.params;
  const { adultos, cadastrado_na_hora = false } = req.body;

  if (!Array.isArray(adultos) || adultos.length === 0) {
    return res.status(400).json({ error: 'A lista de adultos é obrigatória.' });
  }

  const transaction = await sequelize.transaction();

  try {
    const festa = await models.Festa.findByPk(idFesta, { transaction });
    if (!festa) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Festa não encontrada.' });
    }

    const convidadosSalvos = [];
    for (const adulto of adultos) {
      if (
        !adulto ||
        typeof adulto.nome !== 'string' ||
        typeof adulto.telefone !== 'string' ||
        adulto.nome.trim() === '' ||
        adulto.telefone.trim() === ''
      ) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Cada adulto deve ter nome e telefone válidos.',
          detalhes: adulto
        });
      }

      const novoConvidado = await models.ConvidadoFesta.create(
        {
          id_festa: idFesta,
          nome_convidado: adulto.nome,
          telefone_convidado: adulto.telefone,
          telefone_responsavel_contato: adulto.telefone,
          tipo_convidado: 'ADULTO_PAGANTE',
          confirmou_presenca: 'SIM',
          cadastrado_na_hora: cadastrado_na_hora
        },
        { transaction }
      );
      convidadosSalvos.push(novoConvidado);
    }

    await transaction.commit();

    return res.status(201).json({
      mensagem: 'Adultos confirmados com sucesso!',
      convidados: convidadosSalvos
    });
  } catch (error) {
    console.error('Erro ao registrar grupo de adultos:', error);
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({ error: 'Erro interno ao processar sua solicitação.' });
  }
}

export async function listarConvidadosDaFesta(req, res) {
  try {
    const { idFesta } = req.params;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para ver os convidados desta festa.'
      });
    }

    const convidados = await models.ConvidadoFesta.findAll({
      where: { id_festa: idFesta },
      order: [['nome_convidado', 'ASC']]
    });

    return res.status(200).json(convidados);
  } catch (error) {
    console.error('Erro ao listar convidados:', error);
    return res.status(500).json({ error: 'Falha ao listar convidados.' });
  }
}

export async function buscarConvidadosPorNome(req, res) {
  try {
    const { idFesta } = req.params;
    const { nome } = req.query;
    const { usuarioId, usuarioTipo } = req;

    if (!nome) {
      return res.status(400).json({ error: 'O parâmetro de busca "nome" é obrigatório.' });
    }

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para buscar convidados nesta festa.'
      });
    }

    const convidados = await models.ConvidadoFesta.findAll({
      where: {
        id_festa: idFesta,
        nome_convidado: {
          [Op.like]: `%${nome}%`
        }
      },
      order: [['nome_convidado', 'ASC']]
    });

    if (convidados.length === 0) {
      return res
        .status(200)
        .json({ mensagem: 'Nenhum convidado encontrado com o nome fornecido.', convidados: [] });
    }

    return res.status(200).json(convidados);
  } catch (error) {
    console.error('Erro ao buscar convidados por nome:', error);
    return res.status(500).json({ error: 'Falha ao buscar convidados.' });
  }
}

export async function atualizarConvidado(req, res) {
  try {
    const { idFesta, idConvidado } = req.params;
    const dadosAtualizados = req.body;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para atualizar convidados nesta festa.'
      });
    }

    const convidado = await models.ConvidadoFesta.findOne({
      where: { id: idConvidado, id_festa: idFesta }
    });
    if (!convidado) {
      return res
        .status(404)
        .json({ error: 'Convidado não encontrado nesta festa com o ID fornecido.' });
    }

    await convidado.update(dadosAtualizados);

    return res.status(200).json(convidado);
  } catch (error) {
    console.error('Erro ao atualizar convidado:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res
        .status(400)
        .json({ error: 'Dados inválidos para atualizar o convidado.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Falha ao atualizar o convidado.' });
  }
}

export async function deletarConvidado(req, res) {
  try {
    const { idFesta, idConvidado } = req.params;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para deletar convidados desta festa.'
      });
    }

    const convidado = await models.ConvidadoFesta.findOne({
      where: { id: idConvidado, id_festa: idFesta }
    });
    if (!convidado) {
      return res
        .status(404)
        .json({ error: 'Convidado não encontrado nesta festa com o ID fornecido.' });
    }

    await convidado.destroy();

    return res.status(200).json({ mensagem: 'Convidado deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar convidado:', error);
    return res.status(500).json({ error: 'Falha ao deletar o convidado.' });
  }
}

export async function checkinConvidado(req, res) {
  try {
    const { idFesta, idConvidado } = req.params;
    const { _usuarioId, usuarioTipo } = req;

    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Apenas o staff do espaço pode realizar o check-in.' });
    }

    const convidado = await models.ConvidadoFesta.findOne({
      where: { id: idConvidado, id_festa: idFesta }
    });
    if (!convidado) {
      return res.status(404).json({ error: 'Convidado não encontrado nesta festa.' });
    }

    if (convidado.checkin_at) {
      return res
        .status(400)
        .json({ error: `Check-in já realizado para este convidado em ${convidado.checkin_at}.` });
    }

    convidado.checkin_at = new Date();
    await convidado.save();

    // Confirma o check-in pro responsavel direto pela Evolution API
    // (substitui o webhook n8n ab98ae95)
    if (convidado.telefone_responsavel_contato) {
      try {
        await enviarCheckinConvidado({
          nomeConvidado: convidado.nome_convidado,
          telefoneResponsavel: convidado.telefone_responsavel_contato,
          horarioCheckin: convidado.checkin_at
        });
        console.log(`[WhatsApp] Check-in notificado para ${convidado.telefone_responsavel_contato}`);
      } catch (whatsappError) {
        console.error(
          `[WhatsApp] Falha ao notificar check-in [${whatsappError.code || 'ERRO_DESCONHECIDO'}]:`,
          whatsappError.message
        );
      }
    }

    return res.status(200).json({ mensagem: 'Check-in realizado com sucesso!', convidado });
  } catch (error) {
    console.error('Erro ao realizar check-in:', error);
    return res.status(500).json({ error: 'Falha ao realizar check-in.' });
  }
}

export async function checkoutConvidado(req, res) {
  try {
    const { idFesta, idConvidado } = req.params;
    const { _usuarioId, usuarioTipo } = req;

    if (usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Apenas o staff do espaço pode realizar o check-out.' });
    }

    const convidado = await models.ConvidadoFesta.findOne({
      where: { id: idConvidado, id_festa: idFesta }
    });
    if (!convidado) {
      return res.status(404).json({ error: 'Convidado não encontrado nesta festa.' });
    }

    if (!convidado.checkin_at) {
      return res
        .status(400)
        .json({ error: 'Não é possível fazer check-out sem um check-in prévio.' });
    }

    if (convidado.checkout_at) {
      return res
        .status(400)
        .json({ error: `Check-out já realizado para este convidado em ${convidado.checkout_at}.` });
    }

    // Registra o check-out ANTES de notificar (o template usa horario de saida)
    convidado.checkout_at = new Date();
    await convidado.save();

    // Confirma o check-out pro responsavel direto pela Evolution API
    // (substitui o webhook n8n 730bdcaf)
    if (convidado.telefone_responsavel_contato) {
      try {
        await enviarCheckoutConvidado({
          nomeConvidado: convidado.nome_convidado,
          telefoneResponsavel: convidado.telefone_responsavel_contato,
          horarioCheckin: convidado.checkin_at,
          horarioCheckout: convidado.checkout_at
        });
        console.log(`[WhatsApp] Check-out notificado para ${convidado.telefone_responsavel_contato}`);
      } catch (whatsappError) {
        console.error(
          `[WhatsApp] Falha ao notificar check-out [${whatsappError.code || 'ERRO_DESCONHECIDO'}]:`,
          whatsappError.message
        );
      }
    }

    return res.status(200).json({ mensagem: 'Check-out realizado com sucesso!', convidado });
  } catch (error) {
    console.error('Erro ao realizar check-out:', error);
    return res.status(500).json({ error: 'Falha ao realizar check-out.' });
  }
}

export async function buscarConvidadoPorId(req, res) {
  try {
    const { idFesta, idConvidado } = req.params;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res.status(403).json({
        error: 'Acesso negado. Você não tem permissão para visualizar os convidados desta festa.'
      });
    }

    const convidado = await models.ConvidadoFesta.findOne({
      where: {
        id: idConvidado,
        id_festa: idFesta
      }
    });

    if (!convidado) {
      return res
        .status(404)
        .json({ error: 'Convidado não encontrado nesta festa com o ID fornecido.' });
    }

    return res.status(200).json(convidado);
  } catch (error) {
    console.error('Erro ao buscar convidado por ID:', error);
    return res.status(500).json({ error: 'Falha ao buscar convidado.' });
  }
}

export async function buscarFestaPorId(req, res) {
  try {
    const { idFesta } = req.params;
    const { usuarioId, usuarioTipo } = req;

    const festa = await models.Festa.findByPk(idFesta, {
      include: [
        {
          model: models.Usuario,
          as: 'organizador',
          attributes: ['id', 'nome', 'email', 'telefone']
        },
        {
          model: models.ConvidadoFesta,
          as: 'convidados'
        }
      ]
    });

    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada com o ID fornecido.' });
    }

    if (
      usuarioTipo !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO &&
      festa.id_organizador !== usuarioId
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Você não tem permissão para visualizar esta festa.' });
    }

    return res.status(200).json(festa);
  } catch (error) {
    console.error('Erro ao buscar festa por ID:', error);
    return res.status(500).json({ error: 'Falha ao buscar a festa.' });
  }
}

export async function buscarFestaPublicaPorId(req, res) {
  try {
    const { idFesta } = req.params;

    const festa = await models.Festa.findByPk(idFesta, {
      attributes: [
        'id',
        'nome_festa',
        'data_festa',
        'status',
        'horario_inicio',
        'horario_fim',
        'link_convite'
      ]
    });

    if (!festa || festa.status === 'CANCELADA') {
      return res.status(404).json({ error: 'Festa não encontrada ou não está disponível.' });
    }

    return res.status(200).json(festa);
  } catch (error) {
    console.error('Erro ao buscar dados públicos da festa por ID:', error);
    return res.status(500).json({ error: 'Falha ao buscar os dados da festa.' });
  }
}

export async function uploadImagemConvite(req, res) {
  const { idFesta } = req.params;

  try {
    const festa = await models.Festa.findByPk(idFesta);
    if (!festa) return res.status(404).json({ error: 'Festa não encontrada.' });

    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });

    const url = `${req.protocol}://${req.get('host')}/uploads/convites/${req.file.filename}`;

    festa.link_convite = url;
    await festa.save();

    return res.status(200).json({
      mensagem: 'Convite da festa atualizado com sucesso.',
      link_convite: url
    });
  } catch (error) {
    console.error('Erro no upload do convite:', error);
    return res.status(500).json({ error: 'Erro ao processar imagem do convite.' });
  }
}


export async function downloadConvidados(req, res) {
  try {
    const { id } = req.params;

    const festa = await models.Festa.findByPk(id, {
      include: {
        model: models.ConvidadoFesta,
        as: 'convidados',
      },
    });

    if (!festa) {
      return res.status(404).json({ error: 'Festa não encontrada' });
    }

    const workbook = new excel.Workbook();
    
    const worksheetName = `Convidados de ${festa.nome_aniversariante || festa.nome_festa}`.substring(0, 31);
    const worksheet = workbook.addWorksheet(worksheetName);

    worksheet.columns = [
      { header: 'Nome do Convidado', key: 'nome', width: 40 },
      { header: 'Telefone Responsavel', key: 'TelefoneResponsavel', width: 15 },
      { header: 'Aniversario Convidado', key: 'AniversarioCon', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Check-in', key: 'checkin', width: 15 },
      { header: 'Data do Check-in', key: 'dataCheckin', width: 25 },
      { header: 'Check-Out', key: 'checkout', width: 15 },
      { header: 'Data do Check-Out', key: 'dataCheckOut', width: 25 },
    ];

    festa.convidados.forEach((convidado) => {
      worksheet.addRow({
        nome: convidado.nome_convidado,
        TelefoneResponsavel: convidado.telefone_responsavel_contato,
        AniversarioCon: convidado.nascimento_convidado,
        tipo: convidado.tipo_convidado,
        checkin: convidado.checkin_at ? 'Sim' : 'Não',
        dataCheckin: convidado.checkin_at,
        checkout: convidado.checkout_at ? 'Sim' : 'Não',
        dataCheckout: convidado.checkout_at,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const fileNameBase = festa.nome_aniversariante || festa.nome_festa || 'festa_sem_nome';
    const safeFileName = fileNameBase
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]/g, '')
  
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="convidados_${safeFileName}_${festa.id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Erro ao gerar a planilha de convidados:', error);
    res.status(500).json({ error: 'Erro interno ao gerar a planilha.' });
  }
}

export async function dispararMensagem(req, res) {
  const { idFesta } = req.params;
  const { mensagem, statusAlvo } = req.body; 

  try {
    const whereCondition = { id_festa: idFesta };

    if (statusAlvo === 'Presente') {
      whereCondition.checkin_at = { [Op.ne]: null };
      whereCondition.checkout_at = null;
    } else if (statusAlvo === 'Saiu') {
      whereCondition.checkout_at = { [Op.ne]: null };
    } else if (statusAlvo === 'Aguardando') {
      whereCondition.checkin_at = null;
      whereCondition.checkout_at = null;
    }
    
    const convidados = await models.ConvidadoFesta.findAll({ where: whereCondition });

    // Deduplica por telefone: um responsavel com 3 filhos recebe a mensagem 1x so
    const telefonesVistos = new Set();
    const convidadosUnicos = convidados.filter((c) => {
      if (!c.telefone_responsavel_contato) return false;
      const chave = String(c.telefone_responsavel_contato).replace(/\D/g, '');
      if (telefonesVistos.has(chave)) return false;
      telefonesVistos.add(chave);
      return true;
    });

    // Dispara direto pela Evolution API (substitui o webhook n8n f87a6169)
    let enviados = 0;
    let falhas = 0;

    for (const convidado of convidadosUnicos) {
      try {
        await enviarMensagemWhatsApp(convidado.telefone_responsavel_contato, mensagem);
        enviados++;
      } catch (whatsappError) {
        falhas++;
        console.error(
          `[WhatsApp] Falha no disparo em massa p/ ${convidado.telefone_responsavel_contato} [${whatsappError.code || 'ERRO_DESCONHECIDO'}]:`,
          whatsappError.message
        );
      }
    }

    return res.status(200).json({
      mensagem: 'Disparo concluído!',
      quantidade: convidadosUnicos.length,
      enviados,
      falhas
    });
    } catch (error) {
      console.error('Erro ao disparar mensagem:', error);
      return res.status(500).json({ error: 'Falha ao disparar mensagens.' });
    }
  }
