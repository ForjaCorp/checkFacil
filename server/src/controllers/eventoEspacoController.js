import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import models from '../models/index.js';
import { enviarPushNovoEvento } from '../services/pushService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Upload da imagem do evento: 4MB, apenas imagens, nome unico no disco
const UPLOAD_DIR = path.join(__dirname, '../../uploads/eventos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const uploadImagemEvento = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `evento-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidas = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!permitidas.includes(ext)) {
      return cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
    }
    cb(null, true);
  }
});

export { uploadImagemEvento };

// Remove o arquivo de imagem do disco se existir dentro do diretorio de uploads
function removerImagem(imagemUrl) {
  if (!imagemUrl) return;
  const arquivo = path.join(__dirname, '../../', imagemUrl.replace(/^\//, ''));
  if (arquivo.startsWith(UPLOAD_DIR) && fs.existsSync(arquivo)) {
    fs.unlinkSync(arquivo);
  }
}

function validarDatas(dataInicio, dataFim) {
  if (!dataInicio) {
    return 'A data de início é obrigatória.';
  }
  if (dataFim && String(dataFim) < String(dataInicio)) {
    return 'A data final não pode ser anterior à inicial.';
  }
  return null;
}

/** Lista eventos publicados (visivel para clientes logados). */
export async function listarEventosPublicados(_req, res) {
  try {
    const eventos = await models.EventoEspaco.findAll({
      where: { publicado: true },
      order: [
        ['data_inicio', 'ASC']
      ]
    });
    return res.status(200).json({ eventos });
  } catch (error) {
    console.error('Erro ao listar eventos do espaço:', error);
    return res.status(500).json({ error: 'Erro ao listar eventos do espaço.' });
  }
}

/** Lista todos os eventos (adm do espaço). */
export async function listarTodosEventos(_req, res) {
  try {
    const eventos = await models.EventoEspaco.findAll({
      order: [
        ['createdAt', 'DESC']
      ]
    });
    return res.status(200).json({ eventos });
  } catch (error) {
    console.error('Erro ao listar eventos (admin):', error);
    return res.status(500).json({ error: 'Erro ao listar eventos.' });
  }
}

/** Cria um evento (adm do espaço). Imagem opcional via multipart campo "imagem". */
export async function criarEvento(req, res) {
  try {
    const { titulo, descricao, data_inicio, data_fim, link_ingresso } = req.body;

    if (!titulo || !data_inicio) {
      return res.status(400).json({ error: 'Título e data de início são obrigatórios.' });
    }
    const erroData = validarDatas(data_inicio, data_fim);
    if (erroData) {
      return res.status(400).json({ error: erroData });
    }

    const evento = await models.EventoEspaco.create({
      titulo,
      descricao: descricao || null,
      data_inicio,
      data_fim: data_fim || null,
      link_ingresso: link_ingresso || null,
      imagem_url: req.file ? `/uploads/eventos/${req.file.filename}` : null,
      publicado: false
    });

    return res.status(201).json({ evento, mensagem: 'Evento criado com sucesso.' });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Erro ao criar evento do espaço:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: error.errors.map((e) => e.message) });
    }
    return res.status(500).json({ error: 'Erro ao criar evento do espaço.' });
  }
}

/** Atualiza um evento. Campos enviados por multipart (texto + imagem opcional). */
export async function atualizarEvento(req, res) {
  try {
    const evento = await models.EventoEspaco.findByPk(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const { titulo, descricao, data_inicio, data_fim, link_ingresso } = req.body;
    if (titulo !== undefined && !titulo) {
      return res.status(400).json({ error: 'O título não pode ficar vazio.' });
    }
    const erroData = validarDatas(data_inicio ?? evento.data_inicio, data_fim ?? evento.data_fim);
    if (erroData) {
      return res.status(400).json({ error: erroData });
    }

    if (titulo !== undefined) evento.titulo = titulo;
    if (descricao !== undefined) evento.descricao = descricao || null;
    if (data_inicio !== undefined) evento.data_inicio = data_inicio;
    if (data_fim !== undefined) evento.data_fim = data_fim || null;
    if (link_ingresso !== undefined) evento.link_ingresso = link_ingresso || null;

    const imagemAntiga = evento.imagem_url;
    if (req.file) {
      evento.imagem_url = `/uploads/eventos/${req.file.filename}`;
    }
    await evento.save();

    // So apaga a imagem antiga depois de salvar com sucesso
    if (req.file && imagemAntiga) removerImagem(imagemAntiga);

    return res.status(200).json({ evento, mensagem: 'Evento atualizado com sucesso.' });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Erro ao atualizar evento do espaço:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Dados inválidos.', detalhes: error.errors.map((e) => e.message) });
    }
    return res.status(500).json({ error: 'Erro ao atualizar evento do espaço.' });
  }
}

/** Exclui um evento e sua imagem do disco. */
export async function excluirEvento(req, res) {
  try {
    const evento = await models.EventoEspaco.findByPk(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    await evento.destroy();
    removerImagem(evento.imagem_url);

    return res.status(200).json({ mensagem: 'Evento excluído.' });
  } catch (error) {
    console.error('Erro ao excluir evento do espaço:', error);
    return res.status(500).json({ error: 'Erro ao excluir evento do espaço.' });
  }
}

/**
 * Publica (ou despublica) um evento. A publicacao e o gatilho futuro do push
 * (Epico 3 do planejamento); por enquanto apenas muda o estado.
 */
export async function alternarPublicacao(req, res) {
  try {
    const evento = await models.EventoEspaco.findByPk(req.params.id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    evento.publicado = !evento.publicado;
    await evento.save();

    // Disparo de push aos clientes ao publicar (nao bloqueia a resposta)
    let pushesEnviados = 0;
    if (evento.publicado) {
      try {
        pushesEnviados = await enviarPushNovoEvento(evento);
      } catch (error) {
        console.error('[eventos-espaco] Falha ao disparar push da publicacao:', error.message);
      }
    }

    return res.status(200).json({
      evento,
      publicado: evento.publicado,
      pushesEnviados,
      mensagem: evento.publicado
        ? pushesEnviados > 0
          ? `Evento publicado (${pushesEnviados} notificações enviadas).`
          : 'Evento publicado, mas nenhuma notificação foi entregue. Confira se há dispositivos inscritos e se o push está configurado.'
        : 'Evento despublicado.'
    });
  } catch (error) {
    console.error('Erro ao publicar evento do espaço:', error);
    return res.status(500).json({ error: 'Erro ao publicar evento do espaço.' });
  }
}
