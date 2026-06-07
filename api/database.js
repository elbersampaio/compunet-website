const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;
let initPromise;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(text, params) {
  await ensureInit();
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await initSchema();
      await seedAdmin();
    })();
  }
  return initPromise;
}

async function initSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT NOT NULL CHECK(perfil IN ('student','teacher','admin')),
        ativo INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        professor_id INTEGER REFERENCES usuarios(id),
        categoria TEXT,
        imagem_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS aulas (
        id SERIAL PRIMARY KEY,
        curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        conteudo TEXT,
        video_url TEXT,
        ordem INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS matriculas (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        progresso INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(aluno_id, curso_id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs_acesso (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        ip TEXT,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status_login TEXT,
        user_agent TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        email TEXT,
        perfil TEXT,
        ip TEXT,
        user_agent TEXT,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acao TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificados (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
        curso_id INTEGER NOT NULL REFERENCES cursos(id),
        codigo TEXT UNIQUE NOT NULL,
        emitido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

async function seedAdmin() {
  const { rows } = await query('SELECT id FROM usuarios WHERE email = $1', ['admin@mobiliza.com']);
  if (rows.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4)',
      ['Administrador', 'admin@mobiliza.com', hash, 'admin']
    );
  }
}

async function initDb() {
  await ensureInit();
}

module.exports = { query, initDb };
