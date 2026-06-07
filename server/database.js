const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'mobiliza.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedAdmin();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('student','teacher','admin')),
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      professor_id INTEGER REFERENCES usuarios(id),
      categoria TEXT,
      imagem_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS aulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      conteudo TEXT,
      video_url TEXT,
      ordem INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matriculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
      progresso INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(aluno_id, curso_id)
    );

    CREATE TABLE IF NOT EXISTS logs_acesso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER REFERENCES usuarios(id),
      ip TEXT,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      status_login TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      email TEXT,
      perfil TEXT,
      ip TEXT,
      user_agent TEXT,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      acao TEXT
    );

    CREATE TABLE IF NOT EXISTS certificados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      curso_id INTEGER NOT NULL REFERENCES cursos(id),
      codigo TEXT UNIQUE NOT NULL,
      emitido_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedAdmin() {
  const row = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@mobiliza.com');
  if (!row) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)').run(
      'Administrador', 'admin@mobiliza.com', hash, 'admin'
    );
    console.log('Admin padrão criado: admin@mobiliza.com / admin123');
  }
}

module.exports = { getDb };
