import models from '../models/index.js';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import axios from 'axios'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET;

function gerarToken(params = {}) {
  if (!JWT_SECRET) {
    console.error('ERRO CRÍTICO: JWT_SECRET Não foi definido no ambiente!');
    throw new Error('JWT_SECRET Não foi definido no ambiente.');
  }

  return jwt.sign(params, JWT_SECRET, {
    expiresIn: 86400 // 24 horas
  });
}

export async function registrarConvidado(req, res) {
  const { nome, email, senha, telefone } = req.body;

  try {
    const usuarioExistente = await models.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }

    const usuario = await models.Usuario.create({
      nome,
      email,
      senha,
      telefone: telefone || null,
      tipoUsuario: models.Usuario.TIPOS_USUARIO.CONVIDADO
    });

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();

    return res.status(201).json({
      usuario: usuarioSemSenha,
      token: gerarToken({ id: usuario.id, tipo: usuario.tipoUsuario }),
      mensagem: 'Convidado registrado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao registrar Convidado:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Erro ao registrar convidado.' });
  }
}

export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const usuario = await models.Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    if (!(await usuario.compararSenha(senha))) {
      return res.status(400).json({ error: 'Senha inválida.' });
    }

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();

    return res.status(200).json({
      usuario: usuarioSemSenha,
      token: gerarToken({ id: usuario.id, tipo: usuario.tipoUsuario }),
      mensagem: 'Login realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}

export async function registrarAdmEspaco(req, res) {
  const { nome, email, senha, telefone } = req.body;

  try {
    const usuarioExistente = await models.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }

    const usuario = await models.Usuario.create({
      nome,
      email,
      senha,
      telefone: telefone || null,
      tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_ESPACO
    });

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();

    return res.status(201).json({
      usuario: usuarioSemSenha,
      token: gerarToken({ id: usuario.id, tipo: usuario.tipoUsuario }),
      mensagem: 'Administrador de Espaço registrado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao registrar Administrador de Espaço:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Erro ao registrar administrador do espaço.' });
  }
}

export async function registrarAdmFesta(req, res) {
  const { nome, email, senha, telefone } = req.body;

  try {
    const usuarioExistente = await models.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }

    const usuario = await models.Usuario.create({
      nome,
      email,
      senha,
      telefone: telefone || null,
      tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_FESTA
    });

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();

    return res.status(201).json({
      usuario: usuarioSemSenha,
      token: gerarToken({ id: usuario.id, tipo: usuario.tipoUsuario }),
      mensagem: 'Administrador de Festa registrado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao registrar Administrador de Festa:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Erro ao registrar administrador da festa.' });
  }
}

export async function validarSessao(req, res) {
  try {
    const usuario = await models.Usuario.findByPk(req.usuarioId, {
      attributes: { exclude: ['senha', 'redefineSenhaToken', 'redefineSenhaExpiracao'] }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário do token não encontrado.' });
    }

    return res.status(200).json({ usuario });
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return res.status(500).json({ error: 'Erro interno ao validar sessão.' });
  }
}

export async function definirSenha(req, res) {
  try {
    const { token, novaSenha } = req.body;

    // Validação básica
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    // Encontra o utilizador pelo token e verifica se ele não expirou
    const utilizador = await models.Usuario.findOne({
      where: {
        redefineSenhaToken: token,
        redefineSenhaExpiracao: {
          [Op.gt]: new Date() // Agora 'Op' está definido!
        }
      }
    });

    if (!utilizador) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    // Atualiza a senha (o hook no modelo vai hashear)
    utilizador.senha = novaSenha;

    // Invalida o token para não ser usado novamente
    utilizador.redefineSenhaToken = null;
    utilizador.redefineSenhaExpiracao = null;

    // Salva as alterações
    await utilizador.save();

    return res
      .status(200)
      .json({ mensagem: 'Senha definida com sucesso! Agora você já pode fazer o login.' });
  } catch (error) {
    console.error('Erro ao definir a senha:', error);
    return res.status(500).json({ error: 'Falha ao definir a senha.' });
  }
}


export async function solicitarRedefinicaoSenha(req, res) {
  const { email } = req.body

  try {
    const usuario = await models.Usuario.findOne({ where: { email } })
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado com este e-mail.' })
    }

    if (!usuario.telefone) {
      return res.status(400).json({ error: 'Usuário não possui telefone cadastrado.' })
    }

    // Gerar token e expiração
    const token = crypto.randomBytes(20).toString('hex')
    const expiracao = new Date(Date.now() + 3600000) // 1 hora

    usuario.redefineSenhaToken = token
    usuario.redefineSenhaExpiracao = expiracao
    await usuario.save()

    // Montar link
    const resetLink = `https://espacocriar.4growthbr.space/organizer/choosePassword/${token}`

    // Montar mensagem
    const mensagem = `Olá, recebemos sua solicitação de redefinição de senha. Clique no link abaixo para redefinir:\n\n${resetLink}\n\nSe não foi você, ignore esta mensagem.`

    // Chamar o webhook do n8n
   await axios.post(
  'https://workflows.4growthbr.space/webhook/8a71a943-80d8-465c-998e-61aeab9847ec',
  {
    telefone: usuario.telefone,
    mensagem: mensagem
  }
)

    return res.status(200).json({ mensagem: 'Link de redefinição enviado via WhatsApp!' })
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error)
    return res.status(500).json({ error: 'Falha ao solicitar redefinição de senha.' })
  }
}