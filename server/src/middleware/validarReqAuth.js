import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function validarRegistro(req, res, next) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, Email e senha são obrigatórios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  if (typeof email !== 'string' || typeof senha !== 'string') {
    return res.status(400).json({ error: 'Email e senha devem ser strings.' });
  }

  next();
}

export function validarLogin(req, res, next) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  if (typeof email !== 'string' || typeof senha !== 'string') {
    return res.status(400).json({ error: 'Email e senha devem ser strings.' });
  }

  next();
}

export function verificarTokenJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: "Token mal formatado ou tipo de token inválido. Use o formato 'Bearer token'."
    });
  }

  const token = parts[1];

  if (!JWT_SECRET) {
    console.error(
      'ERRO CRÍTICO NO MIDDLEWARE: JWT_SECRET não está definido nas variáveis de ambiente!'
    );
    return res.status(500).json({
      error: 'Erro interno no servidor (configuração de autenticação).'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.usuarioId = decoded.id; // ID do usuário logado
    req.usuarioTipo = decoded.tipo; // Tipo do usuário logado

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor, faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    console.error('Erro não esperado ao verificar token:', err);
    return res.status(500).json({ error: 'Falha na autenticação do token.' });
  }
}

export function permitirApenas(...tiposPermitidos) {
  return (req, res, next) => {
    const { usuarioTipo } = req;

    if (!usuarioTipo) {
      return res
        .status(401)
        .json({ error: 'Informações de usuário não encontradas. Falha na autenticação.' });
    }

    if (tiposPermitidos.includes(usuarioTipo)) {
      return next();
    } else {
      return res
        .status(403)
        .json({ error: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
    }
  };
}

export function isAdminEspaco(req, res, next) {
  const { usuarioTipo } = req;

  if (!usuarioTipo) {
    return res.status(401).json({ 
      error: 'Informações de usuário não encontradas. Falha na autenticação.' 
    });
  }

  // Verifica se o tipo é Adm_espaco conforme o valor salvo no token
  if (usuarioTipo === 'Adm_espaco') {
    return next();
  }

  return res.status(403).json({ 
    error: 'Acesso negado. Você não tem permissão de administrador do espaço para realizar esta ação.' 
  });
}
