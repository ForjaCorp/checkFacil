import models from '../models/index.js';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { enviarMensagemWhatsApp, enviarConviteAdmEspaco, normalizarTelefone } from '../services/whatsappService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Upload de avatar: 2MB, apenas imagens, nome unico no disco
const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `avatar-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidas = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (!permitidas.includes(ext)) {
      return cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'))
    }
    cb(null, true)
  }
})

export { uploadAvatar }

const JWT_SECRET = process.env.JWT_SECRET;

function gerarToken(params = {}) {
  if (!JWT_SECRET) {
    console.error('ERRO CRÍTICO: JWT_SECRET Não foi definido no ambiente!');
    throw new Error('JWT_SECRET Não foi definido no ambiente.');
  }

  return jwt.sign(params, JWT_SECRET, {
    expiresIn: '10d' 
  });
}

export async function login(req, res) {
  // Aceita email OU telefone no campo "email" (detecta pelo @)
  const { email, senha } = req.body;

  try {
    let usuario;

    const identificador = String(email || '').trim();

    if (identificador.includes('@')) {
      usuario = await models.Usuario.findOne({ where: { email: identificador } });
    } else {
      // O 55 so e codigo do pais em numeros com 12/13 digitos. Isso evita
      // remover por engano o DDD 55 de um telefone nacional.
      const telefoneNacional = (valor) => {
        const digitos = String(valor || '').replace(/\D/g, '');
        return digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
      };
      const digitos = telefoneNacional(identificador);
      const candidatos = await models.Usuario.findAll({ where: { telefone: { [Op.ne]: null } } });
      usuario = candidatos.find(
        (u) => telefoneNacional(u.telefone) === digitos
      );
    }

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

/**
 * Lista todos os Adm_espaco (uso da pagina de gestao de equipe).
 * So pode ser chamado por outro Adm_espaco (guardado na rota).
 */
export async function listarAdmsEspaco(req, res) {
  try {
    const adms = await models.Usuario.findAll({
      where: { tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_ESPACO },
      attributes: ['id', 'nome', 'email', 'telefone', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });
    return res.status(200).json({ adms });
  } catch (error) {
    console.error('Erro ao listar administradores do espaço:', error);
    return res.status(500).json({ error: 'Erro ao listar administradores do espaço.' });
  }
}

/**
 * Cadastra um novo Adm_espaco e envia o link de definicao de senha
 * via WhatsApp (mesmo fluxo do cliente novo). Se o WhatsApp falhar,
 * o usuario e criado mesmo assim e o erro e informado pro adm reenviar.
 */
export async function convidarAdmEspaco(req, res) {
  const { nome, email, telefone } = req.body;

  try {
    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios.' });
    }

    const digitos = String(telefone).replace(/\D/g, '');
    const telefoneNormalizado = normalizarTelefone(digitos);
    if (!telefoneNormalizado) {
      return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número (com ou sem 55).' });
    }

    const usuarioExistente = await models.Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado.' });
    }

    const tokenDefinicaoSenha = crypto.randomBytes(20).toString('hex');
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 48);

    const usuario = await models.Usuario.create({
      nome,
      email,
      senha: crypto.randomBytes(24).toString('hex'), // provisoria: adm define via link
      telefone: telefoneNormalizado,
      tipoUsuario: models.Usuario.TIPOS_USUARIO.ADM_ESPACO,
      redefineSenhaToken: tokenDefinicaoSenha,
      redefineSenhaExpiracao: expiracao
    });

    let whatsappEnviado = true;
    let whatsappErro = null;
    try {
      await enviarConviteAdmEspaco({ nomeAdm: nome, telefoneAdm: telefoneNormalizado, token: tokenDefinicaoSenha });
    } catch (e) {
      whatsappEnviado = false;
      whatsappErro = e.message;
      console.error(`[WhatsApp] Falha ao enviar convite de adm [${e.code || 'ERRO'}]:`, e.message);
    }

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();

    return res.status(201).json({
      usuario: usuarioSemSenha,
      whatsappEnviado,
      ...(whatsappErro ? { aviso: `Administrador criado, mas o WhatsApp falhou: ${whatsappErro}` } : {}),
      mensagem: 'Administrador de Espaço convidado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao convidar administrador do espaço:', error);
    if (error.name === 'SequelizeValidationError') {
      const erros = error.errors.map((e) => e.message);
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: erros });
    }
    return res.status(500).json({ error: 'Erro ao convidar administrador do espaço.' });
  }
}

/**
 * Reenvia o link de definicao de senha de um adm da equipe via WhatsApp
 * (quando expirou ou ele nao recebeu).
 */
export async function reenviarSenhaAdm(req, res) {
  const { id } = req.params;

  try {
    const adm = await models.Usuario.findByPk(id);
    if (!adm || adm.tipoUsuario !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }
    if (!adm.telefone) {
      return res.status(400).json({ error: 'Este administrador não tem telefone cadastrado.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 48);

    adm.redefineSenhaToken = token;
    adm.redefineSenhaExpiracao = expiracao;
    await adm.save();

    await enviarConviteAdmEspaco({ nomeAdm: adm.nome, telefoneAdm: adm.telefone, token });

    return res.status(200).json({ mensagem: `Link de senha reenviado para ${adm.telefone}.` });
  } catch (error) {
    console.error('Erro ao reenviar senha de administrador:', error);
    return res.status(502).json({
      error: error.message || 'Falha ao enviar o WhatsApp. Verifique a conexão e tente novamente.'
    });
  }
}

/**
 * Exclui um adm da equipe. Bloqueia excluir a si mesmo (evita lockout)
 * e os emails admin do .env (titulares).
 */
export async function excluirAdm(req, res) {
  const { id } = req.params;

  try {
    if (Number(id) === req.usuarioId) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
    }

    const adm = await models.Usuario.findByPk(id);
    if (!adm || adm.tipoUsuario !== models.Usuario.TIPOS_USUARIO.ADM_ESPACO) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    const emailsTitulares = String(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (emailsTitulares.includes(adm.email.toLowerCase())) {
      return res.status(400).json({ error: 'Uma conta titular não pode ser excluída.' });
    }

    await adm.destroy();
    return res.status(200).json({ mensagem: 'Administrador excluído.' });
  } catch (error) {
    console.error('Erro ao excluir administrador:', error);
    return res.status(500).json({ error: 'Erro ao excluir administrador.' });
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
  const { telefone } = req.body

  if (!telefone || !String(telefone).replace(/\D/g, '')) {
    return res.status(400).json({ error: 'Informe o telefone cadastrado (com DDD).' })
  }

  try {
    // Busca usuario comparando apenas os digitos do telefone (aceita qualquer
    // formato cadastrado: com mascaras, com ou sem 55)
    const digitos = String(telefone).replace(/\D/g, '')
    const candidatos = await models.Usuario.findAll({ where: { telefone: { [Op.ne]: null } } })
    const usuario = candidatos.find(
      (u) => String(u.telefone).replace(/\D/g, '').replace(/^55/, '') === digitos.replace(/^55/, '')
    )

    if (!usuario) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com este telefone.' })
    }

    // Gerar token e expiração
    const token = crypto.randomBytes(20).toString('hex')
    // 10 dias em milissegundos: 10 * 24h * 60m * 60s * 1000ms
    const expiracao = new Date(Date.now() + (10 * 24 * 60 * 60 * 1000))

    usuario.redefineSenhaToken = token
    usuario.redefineSenhaExpiracao = expiracao
    await usuario.save()

    // Montar link e mensagem
    const frontUrl = process.env.FRONT_URL || 'https://espacocriar.4growthbr.space'
    const resetLink = `${frontUrl}/organizer/choosePassword/${token}`
    const mensagem = `Olá, ${usuario.nome}! Recebemos sua solicitação de redefinição de senha. Clique no link abaixo para redefinir:\n\n${resetLink}\n\nSe não foi você, ignore esta mensagem.`

    // Envia direto pela Evolution API (substitui o webhook n8n 8a71a943)
    await enviarMensagemWhatsApp(usuario.telefone, mensagem)

    return res.status(200).json({ mensagem: 'Link de redefinição enviado via WhatsApp!' })
  } catch (error) {
    // Erros do whatsappService vem classificados com .code
    if (error.code && String(error.code).startsWith('EVO_')) {
      console.error(`[WhatsApp] Falha no reset de senha [${error.code}]:`, error.message)
      return res.status(502).json({
        error: 'Falha ao enviar o WhatsApp. ' + error.message
      })
    }

    console.error('Erro ao solicitar redefinição de senha:', error)
    return res.status(500).json({ error: 'Erro interno ao solicitar redefinição. Tente novamente.' })
  }
}

export async function atualizarPerfil(req, res) {
  try {
    const usuario = await models.Usuario.findByPk(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const telefone = String(req.body.telefone || '').trim();
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    const emailEmUso = await models.Usuario.findOne({
      where: { email, id: { [Op.ne]: usuario.id } }
    });
    if (emailEmUso) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    usuario.nome = nome;
    usuario.email = email;
    // Padrao do banco: apenas digitos com codigo do pais (ex: 5579999431920).
    // Telefone vazio limpa o campo; preenchido e invalido devolve 400.
    const telefoneNormalizado = telefone ? normalizarTelefone(telefone) : null;
    if (telefone && !telefoneNormalizado) {
      return res.status(400).json({ error: 'Telefone inválido. Informe DDD + número (com ou sem 55).' });
    }
    usuario.telefone = telefoneNormalizado;
    if (req.file) {
      if (usuario.fotoUrl) {
        const antiga = path.join(__dirname, '../../', usuario.fotoUrl.replace(/^\//, ''));
        if (antiga.startsWith(UPLOAD_DIR) && fs.existsSync(antiga)) fs.unlinkSync(antiga);
      }
      usuario.fotoUrl = `/uploads/avatars/${req.file.filename}`;
    }
    await usuario.save();

    const { senha: _, redefineSenhaToken: __, redefineSenhaExpiracao: ___, ...perfil } = usuario.toJSON();
    return res.status(200).json({ usuario: perfil, mensagem: 'Perfil atualizado com sucesso.' });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: error.message || 'Erro ao atualizar perfil.' });
  }
}
