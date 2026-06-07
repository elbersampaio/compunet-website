const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./database');

const app = express();

initDb().catch(err => console.error('[DB] Erro ao inicializar:', err));

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});
app.use('/api/auth/login', loginLimiter);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const logRoutes = require('./routes/logs');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/cursos', courseRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, _next) => {
  console.error('[ERRO]', err.stack || err.message || err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

module.exports = app;
