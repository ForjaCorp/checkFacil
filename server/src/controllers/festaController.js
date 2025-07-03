import models from '../models/index.js';
import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import axios from 'axios';

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
      expiracao.setHours(expiracao.getHours() + 24); // Token válido por 24h

      clienteOrganizador.redefineSenhaToken = tokenDefinicaoSenha;
      clienteOrganizador.redefineSenhaExpiracao = expiracao;

      await clienteOrganizador.save();

      const webhookUrl =
        'https://webhook.4growthbr.space/webhook/2cd048a2-c416-4e42-8202-e0979aa36cca';
      try {
        const payloadWebhook = {
          nomeCliente: clienteOrganizador.nome,
          emailCliente: clienteOrganizador.email,
          telefoneCliente: clienteOrganizador.telefone,

          token: tokenDefinicaoSenha
        };

        // eslint-disable-next-line no-console
        console.log('Enviando dados para o webhook n8n:', payloadWebhook);

        axios.post(webhookUrl, payloadWebhook).catch((webhookError) => {
          console.error(
            'Erro secundário ao enviar o webhook para n8n:',
            webhookError.response ? webhookError.response.data : webhookError.message
          );
        });
      } catch (webhookError) {
        console.error('Erro ao tentar disparar o webhook para n8n:', webhookError.message);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`Cliente já existente encontrado: ${clienteOrganizador.email}`);
    }

    const novaFesta = await models.Festa.create({
      ...dadosFesta,
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

    // Filtro de Status
    if (status) {
      whereClause.status = status;
    }

    // Filtro de Data
    if (data) {
      whereClause.data_festa = data;
    } else if (data_inicio && data_fim) {
      whereClause.data_festa = { [Op.between]: [data_inicio, data_fim] };
    }

    // Busca Textual
    if (search) {
      whereClause[Op.or] = [
        { nome_festa: { [Op.like]: `%${search}%` } },
        { nome_aniversariante: { [Op.like]: `%${search}%` } },
        { '$organizador.nome$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Paginação
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    // findAndCountAll para obter os dados e a contagem total para a paginação
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

    //resposta com os dados e as informações de paginação
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

    await festa.update(dadosAtualizados);

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

    await festa.destroy();

    return res.status(200).json({ mensagem: 'Festa deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar festa:', error);
    return res.status(500).json({ error: 'Falha ao deletar a festa.' });
  }
}

export async function adicionarConvidado(req, res) {
  try {
    const { idFesta } = req.params;
    const dadosConvidado = req.body;
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
        error: 'Acesso negado. Você não tem permissão para adicionar convidados a esta festa.'
      });
    }

    if (!dadosConvidado.nome_convidado || !dadosConvidado.tipo_convidado) {
      return res.status(400).json({ error: 'Nome e tipo do convidado são obrigatórios.' });
    }

    // Cria o novo convidado, associando-o à festa
    const novoConvidado = await models.ConvidadoFesta.create({
      ...dadosConvidado,
      id_festa: idFesta
    });

    return res.status(201).json(novoConvidado);
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Dados inválidos para o convidado.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Falha ao adicionar convidado.' });
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

    // permissão
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

    const webhookUrl =
      'https://webhook.4growthbr.space/webhook/ab98ae95-08c2-40b2-a942-c40071b588eb'; // URL CheckIN
    try {
      const payloadWebhook = {
        nomeCrianca: convidado.nome_convidado,
        nomeResponsavel: convidado.nome_responsavel,
        telefoneResponsavel: convidado.telefone_responsavel,
        horarioCheckin: convidado.checkin_at,
        mensagem: `Check-in realizado para este convidado`
      };

      console.log('Enviando dados para o webhook n8n:', payloadWebhook);

      axios.post(webhookUrl, payloadWebhook).catch((webhookError) => {
        console.error(
          'Erro secundário ao enviar o webhook para n8n:',
          webhookError.response ? webhookError.response.data : webhookError.message
        );
      });
    } catch (webhookError) {
      console.error('Erro ao tentar disparar o webhook para n8n:', webhookError.message);
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

    const webhookUrl =
      'https://webhook.4growthbr.space/webhook/730bdcaf-8066-410c-a12c-1304b1bc65b0'; // URL CheckOut
    try {
      const payloadWebhook = {
        nomeCrianca: convidado.nome_convidado,
        nomeResponsavel: convidado.nome_responsavel,
        telefoneResponsavel: convidado.telefone_responsavel,
        horarioCheckin: convidado.checkin_at,
        horarioCheckout: convidado.checkout_at,

        mensagem: `Check-out feito ${convidado.checkin_at}.`
      };

      console.log('Enviando dados para o webhook n8n:', payloadWebhook);

      axios.post(webhookUrl, payloadWebhook).catch((webhookError) => {
        console.error(
          'Erro secundário ao enviar o webhook para n8n:',
          webhookError.response ? webhookError.response.data : webhookError.message
        );
      });
    } catch (webhookError) {
      console.error('Erro ao tentar disparar o webhook para n8n:', webhookError.message);
    }

    convidado.checkout_at = new Date();
    await convidado.save();

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

    // Se o utilizador logado NÃO é um AdmEspaco E NÃO é o organizador da festa...
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
