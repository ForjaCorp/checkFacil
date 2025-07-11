import sequelize from '../config/database.js';

import Usuario from './Usuarios.js';
import Festa from './Festa.js';
import ConvidadoFesta from './ConvidadoFesta.js';
import Playlist from './Playlist.js';

const models = {
  Usuario,
  Festa,
  ConvidadoFesta,
  Playlist
};

Object.values(models).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export default models;
