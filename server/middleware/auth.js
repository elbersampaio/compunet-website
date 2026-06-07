const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mobiliza-jwt-secret-2026';

function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil, nome: usuario.nome },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { autenticar, gerarToken, JWT_SECRET };
