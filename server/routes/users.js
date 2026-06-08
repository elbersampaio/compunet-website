const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

function registrarAuditoria(usuario_id, email, perfil, ip, user_agent, acao) {
  const db = getDb();
  db.prepare(`
    INSERT INTO auditoria (usuario_id, email, perfil, ip, user_agent, acao)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuario_id, email, perfil, ip, user_agent, acao);
}

router.get('/', autenticar, autorizar('admin'), (req, res) => {
  const db = getDb();
  const usuarios = db.prepare('SELECT id, nome, email, perfil, ativo, created_at FROM usuarios ORDER BY created_at DESC').all();
  res.json(usuarios);
});

router.post('/', autenticar, autorizar('admin'), (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const db = getDb();

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
    if (existente) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const hash = bcrypt.hashSync(senha, 10);
    const result = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)').run(
      nome.trim(), email.toLowerCase().trim(), hash, perfil
    );

    registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, `Criação de usuário: ${email} (${perfil})`);

    res.status(201).json({
      id: result.lastInsertRowid,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      perfil,
      mensagem: 'Usuário criado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', autenticar, autorizar('admin'), (req, res) => {
  try {
    const { nome, email, perfil, ativo } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const db = getDb();

    const updates = [];
    const params = [];

    if (nome !== undefined) { updates.push('nome = ?'); params.push(nome.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.toLowerCase().trim()); }
    if (perfil !== undefined) { updates.push('perfil = ?'); params.push(perfil); }
    if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo); }

    if (updates.length === 0) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });

    params.push(req.params.id);
    db.prepare(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, `Alteração de usuário ID:${req.params.id}`);

    res.json({ mensagem: 'Usuário atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', autenticar, autorizar('admin'), (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const db = getDb();

    const usuario = db.prepare('SELECT email, perfil FROM usuarios WHERE id = ?').get(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);

    registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, `Exclusão de usuário: ${usuario.email} (${usuario.perfil})`);

    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/professores', autenticar, (req, res) => {
  const db = getDb();
  const professores = db.prepare('SELECT id, nome, email FROM usuarios WHERE perfil = ? AND ativo = 1').all('teacher');
  res.json(professores);
});

router.get('/alunos', autenticar, autorizar('admin', 'teacher'), (req, res) => {
  const db = getDb();
  const alunos = db.prepare('SELECT id, nome, email, created_at FROM usuarios WHERE perfil = ? AND ativo = 1').all('student');
  res.json(alunos);
});

module.exports = router;
