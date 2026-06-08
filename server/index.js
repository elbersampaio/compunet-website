const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDb } = require('./database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://mobiliza-inteligente.vercel.app' : '*' }));
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

app.use(express.static(path.join(__dirname, '..')));

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

process.on('uncaughtException', (err) => {
  console.error('[ERRO FATAL]', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[REJEIÇÃO NÃO TRATADA]', reason);
});

const server = app.listen(PORT, () => {
  console.log(`\n  Mobiliza Server rodando em http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log(`  Login padrão: admin@mobiliza.com / admin123\n`);
});

function gracefulShutdown() {
  console.log('\n  Encerrando servidor...');
  const db = require('./database').getDb();
  if (db) { db.close(); }
  server.close(() => {
    console.log('  Servidor encerrado.\n');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

getDb();
