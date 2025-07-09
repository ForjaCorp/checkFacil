import models from '../models/index.js';

export async function criarPlaylist(req, res) {
  try {
    const { nome, link } = req.body;
    if (!nome || !link) return res.status(400).json({ error: 'Nome e link são obrigatórios.' });

    const nova = await models.Playlist.create({ nome, link });
    return res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar playlist.' });
  }
}

export async function listarPlaylists(req, res) {
  try {
    const playlists = await models.Playlist.findAll();
    return res.status(200).json(playlists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar playlists.' });
  }
}

export async function buscarPlaylistPorId(req, res) {
  try {
    const { id } = req.params;
    const playlist = await models.Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    return res.status(200).json(playlist);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar playlist.' });
  }
}

export async function atualizarPlaylist(req, res) {
  try {
    const { id } = req.params;
    const { nome, link } = req.body;
    const playlist = await models.Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });

    playlist.nome = nome || playlist.nome;
    playlist.link = link || playlist.link;
    await playlist.save();

    return res.status(200).json(playlist);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar playlist.' });
  }
}

export async function deletarPlaylist(req, res) {
  try {
    const { id } = req.params;
    const playlist = await models.Playlist.findByPk(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });

    await playlist.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar playlist.' });
  }
}
