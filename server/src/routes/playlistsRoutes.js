import express from 'express';
import * as playlistController from '../controllers/playlistController.js';

const router = express.Router();

router.post('/playlists', playlistController.criarPlaylist);
router.get('/playlists', playlistController.listarPlaylists);
router.get('/playlists/:id', playlistController.buscarPlaylistPorId);
router.patch('/playlists/:id', playlistController.atualizarPlaylist);
router.delete('/playlists/:id', playlistController.deletarPlaylist);

export default router;
