import express from 'express';
import * as playlistController from '../controllers/playlistController.js';

const router = express.Router();

router.post('/', playlistController.criarPlaylist);
router.get('/', playlistController.listarPlaylists);
router.get('/:id', playlistController.buscarPlaylistPorId);
router.patch('/:id', playlistController.atualizarPlaylist);
router.delete('/:id', playlistController.deletarPlaylist);

export default router;
