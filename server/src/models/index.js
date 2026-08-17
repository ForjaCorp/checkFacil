import sequelize from '../config/database.js';

import Usuario from './Usuarios.js';
import Festa from './Festa.js';
import ConvidadoFesta from './ConvidadoFesta.js';
import Playlist from './Playlist.js';
import EventoEspaco from './EventoEspaco.js';
import PushSubscription from './PushSubscription.js';
import NotificacaoAgendada from './NotificacaoAgendada.js';
import ResponsavelFamiliar from './ResponsavelFamiliar.js';
import Dependente from './Dependente.js';
import ResponsavelDependente from './ResponsavelDependente.js';
import OtpPerfilFamiliar from './OtpPerfilFamiliar.js';

const models = {
  Usuario,
  Festa,
  ConvidadoFesta,
  Playlist,
  EventoEspaco,
  PushSubscription,
  NotificacaoAgendada,
  ResponsavelFamiliar,
  Dependente,
  ResponsavelDependente,
  OtpPerfilFamiliar
};

Object.values(models).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export default models;
