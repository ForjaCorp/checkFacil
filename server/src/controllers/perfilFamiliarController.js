import { createHash, randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

import models, { sequelize } from '../models/index.js';
import { enviarMensagemWhatsApp, normalizarTelefone } from '../services/whatsappService.js';

const OTP_MINUTOS = 10;
const LIMITE_TELEFONE = 3;
const LIMITE_IP = 10;
const MAX_TENTATIVAS = 5;
const NECESSIDADES_PERMITIDAS = new Set([
  'Alimentação ou alergia',
  'Acessibilidade ou mobilidade',
  'Sensibilidade a som, luz ou aglomeração',
  'Necessidade de acompanhante',
  'Medicação ou cuidado importante'
]);

const necessidadesValidas = (value) =>
  Array.isArray(value) ? [...new Set(value.filter((item) => NECESSIDADES_PERMITIDAS.has(item)))] : null;

const hashCodigo = (telefone, codigo) =>
  createHash('sha256').update(`${telefone}:${codigo}:${process.env.JWT_SECRET}`).digest('hex');

const perfilCompleto = (id) =>
  models.ResponsavelFamiliar.findByPk(id, {
    attributes: ['id', 'nome', 'telefone_normalizado', 'consentimento_dados_em'],
    include: [{
      model: models.Dependente,
      as: 'dependentes',
      where: { ativo: true },
      required: false,
      through: { attributes: [] },
      attributes: ['id', 'nome', 'data_nascimento', 'necessidades_recorrentes', 'necessidades_revisadas_em']
    }]
  });

export async function solicitarOtp(req, res) {
  const telefone = normalizarTelefone(req.body.telefone);
  const idFesta = Number(req.body.idFesta);
  if (!telefone) return res.status(400).json({ error: 'Informe um telefone celular válido.' });
  const festa = await models.Festa.findByPk(idFesta, { attributes: ['id', 'status'] });
  if (!festa || festa.status === 'CANCELADA') return res.status(404).json({ error: 'Festa não disponível.' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Verificação indisponível no servidor.' });

  const desde = new Date(Date.now() - OTP_MINUTOS * 60 * 1000);
  const ip = req.ip;
  const [porTelefone, porIp] = await Promise.all([
    models.OtpPerfilFamiliar.count({ where: { telefone_normalizado: telefone, createdAt: { [Op.gte]: desde } } }),
    models.OtpPerfilFamiliar.count({ where: { ip_solicitante: ip, createdAt: { [Op.gte]: desde } } })
  ]);
  if (porTelefone >= LIMITE_TELEFONE || porIp >= LIMITE_IP) {
    return res.status(429).json({ error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.' });
  }

  const codigo = String(randomInt(100000, 1000000));
  const otp = await models.OtpPerfilFamiliar.create({
    telefone_normalizado: telefone,
    id_festa: idFesta,
    codigo_hash: hashCodigo(telefone, codigo),
    expira_em: new Date(Date.now() + OTP_MINUTOS * 60 * 1000),
    ip_solicitante: ip
  });

  try {
    await enviarMensagemWhatsApp(
      telefone,
      `Seu código de confirmação do CheckFácil é ${codigo}. Ele expira em ${OTP_MINUTOS} minutos. Não compartilhe este código.`
    );
  } catch (error) {
    await otp.destroy();
    console.error(`[Perfil familiar] Falha ao enviar OTP [${error.code || 'ERRO'}]:`, error.message);
    return res.status(502).json({ error: 'Não foi possível enviar o código pelo WhatsApp. Tente novamente.' });
  }

  return res.json({ mensagem: 'Se o telefone puder receber mensagens, o código foi enviado.' });
}

export async function validarOtp(req, res) {
  const telefone = normalizarTelefone(req.body.telefone);
  const idFesta = Number(req.body.idFesta);
  const codigo = String(req.body.codigo || '').replace(/\D/g, '');
  const nome = String(req.body.nome || '').trim();
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Verificação indisponível no servidor.' });
  if (!telefone || !/^\d{6}$/.test(codigo) || nome.length < 3) {
    return res.status(400).json({ error: 'Telefone, código e nome são obrigatórios.' });
  }

  const otp = await models.OtpPerfilFamiliar.findOne({
    where: { telefone_normalizado: telefone, id_festa: idFesta, usado_em: null },
    order: [['createdAt', 'DESC']]
  });
  if (!otp || otp.expira_em < new Date() || otp.tentativas >= MAX_TENTATIVAS) {
    return res.status(400).json({ error: 'Código inválido ou expirado.' });
  }

  if (otp.codigo_hash !== hashCodigo(telefone, codigo)) {
    await otp.increment('tentativas');
    return res.status(400).json({ error: 'Código inválido ou expirado.' });
  }

  const responsavel = await sequelize.transaction(async (transaction) => {
    otp.usado_em = new Date();
    await otp.save({ transaction });
    const [perfil, criado] = await models.ResponsavelFamiliar.findOrCreate({
      where: { telefone_normalizado: telefone },
      defaults: {
        nome,
        telefone_verificado_em: new Date(),
        consentimento_dados_em: req.body.consentimento ? new Date() : null
      },
      transaction
    });
    perfil.telefone_verificado_em = new Date();
    if (criado || req.body.atualizarNome) perfil.nome = nome;
    if (req.body.consentimento && !perfil.consentimento_dados_em) perfil.consentimento_dados_em = new Date();
    await perfil.save({ transaction });
    return perfil;
  });

  const token = jwt.sign(
    { escopo: 'perfil_familiar', responsavelId: responsavel.id, telefone, idFesta },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
  return res.json({ token, perfil: await perfilCompleto(responsavel.id) });
}

export async function buscarMeuPerfil(req, res) {
  const perfil = await perfilCompleto(req.perfilFamiliar.responsavelId);
  if (!perfil) return res.status(404).json({ error: 'Perfil familiar não encontrado.' });
  return res.json(perfil);
}

export async function atualizarMeuPerfil(req, res) {
  const perfil = await models.ResponsavelFamiliar.findByPk(req.perfilFamiliar.responsavelId);
  const nome = String(req.body.nome || '').trim();
  if (!perfil || nome.length < 3) return res.status(400).json({ error: 'Informe um nome válido.' });
  perfil.nome = nome;
  if (req.body.consentimento === true && !perfil.consentimento_dados_em) perfil.consentimento_dados_em = new Date();
  await perfil.save();
  return res.json(await perfilCompleto(perfil.id));
}

export async function adicionarDependente(req, res) {
  const nome = String(req.body.nome || '').trim();
  const dataNascimento = req.body.data_nascimento;
  if (nome.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento || '')) {
    return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
  }
  const dependente = await sequelize.transaction(async (transaction) => {
    const novo = await models.Dependente.create({
      nome,
      data_nascimento: dataNascimento,
      necessidades_recorrentes: necessidadesValidas(req.body.necessidades_recorrentes),
      necessidades_revisadas_em: new Date()
    }, { transaction });
    await models.ResponsavelDependente.create({
      id_responsavel: req.perfilFamiliar.responsavelId,
      id_dependente: novo.id
    }, { transaction });
    return novo;
  });
  return res.status(201).json(dependente);
}

export async function atualizarDependente(req, res) {
  const vinculo = await models.ResponsavelDependente.findOne({ where: {
    id_responsavel: req.perfilFamiliar.responsavelId,
    id_dependente: req.params.id,
    pode_editar: true
  } });
  if (!vinculo) return res.status(404).json({ error: 'Dependente não encontrado.' });
  const dependente = await models.Dependente.findByPk(req.params.id);
  const nome = String(req.body.nome || '').trim();
  if (nome.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(req.body.data_nascimento || '')) {
    return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
  }
  await dependente.update({
    nome,
    data_nascimento: req.body.data_nascimento,
    necessidades_recorrentes: necessidadesValidas(req.body.necessidades_recorrentes),
    necessidades_revisadas_em: new Date()
  });
  return res.json(dependente);
}

export async function excluirMeuPerfil(req, res) {
  const idResponsavel = req.perfilFamiliar.responsavelId;
  await sequelize.transaction(async (transaction) => {
    const vinculos = await models.ResponsavelDependente.findAll({
      where: { id_responsavel: idResponsavel },
      transaction
    });
    await models.ResponsavelDependente.destroy({ where: { id_responsavel: idResponsavel }, transaction });
    await models.ResponsavelFamiliar.destroy({ where: { id: idResponsavel }, transaction });
    for (const vinculo of vinculos) {
      const outrosResponsaveis = await models.ResponsavelDependente.count({
        where: { id_dependente: vinculo.id_dependente },
        transaction
      });
      if (outrosResponsaveis === 0) {
        await models.Dependente.destroy({ where: { id: vinculo.id_dependente }, transaction });
      }
    }
  });
  return res.status(204).send();
}
