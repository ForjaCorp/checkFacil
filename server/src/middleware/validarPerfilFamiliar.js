import jwt from 'jsonwebtoken';

export function verificarTokenPerfilFamiliar(req, res, next) {
  const token = req.headers['x-family-token'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Confirme o telefone para continuar.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.escopo !== 'perfil_familiar' || !payload.responsavelId || !payload.telefone) {
      throw new Error('Escopo inválido');
    }
    req.perfilFamiliar = payload;
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'A confirmação do telefone expirou. Solicite outro código.' });
  }
}
