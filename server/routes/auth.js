const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { autenticar, gerarToken } = require('../middleware/auth');

const router = express.Router();

function registrarAuditoria(usuario_id, email, perfil, ip, user_agent, acao) {
  const db = getDb();
  db.prepare(`
    INSERT INTO auditoria (usuario_id, email, perfil, ip, user_agent, acao)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(usuario_id, email, perfil, ip, user_agent, acao);
}

function registrarLogAcesso(usuario_id, ip, status, user_agent) {
  const db = getDb();
  db.prepare(`
    INSERT INTO logs_acesso (usuario_id, ip, status_login, user_agent)
    VALUES (?, ?, ?, ?)
  `).run(usuario_id, ip, status, user_agent);
}

router.post('/register', (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const db = getDb();
    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
    if (existente) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const hash = bcrypt.hashSync(senha, 10);
    const result = db.prepare(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)'
    ).run(nome.trim(), email.toLowerCase().trim(), hash, 'student');

    const usuario = {
      id: result.lastInsertRowid,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      perfil: 'student'
    };

    const token = gerarToken(usuario);
    registrarLogAcesso(usuario.id, ip, 'sucesso', ua);
    registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Cadastro realizado');

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const db = getDb();
    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());

    if (!usuario) {
      registrarAuditoria(null, email, null, ip, ua, 'Tentativa de login inválida');
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    if (!usuario.ativo) {
      registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Login bloqueado - usuário inativo');
      return res.status(403).json({ erro: 'Usuário desativado. Contate o administrador.' });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      registrarLogAcesso(usuario.id, ip, 'falha', ua);
      registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Tentativa de login inválida');
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = gerarToken(usuario);
    registrarLogAcesso(usuario.id, ip, 'sucesso', ua);
    registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Login realizado');

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

router.post('/logout', autenticar, (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, 'Logout');
  res.json({ mensagem: 'Logout registrado' });
});

router.get('/me', autenticar, (req, res) => {
  const db = getDb();
  const usuario = db.prepare('SELECT id, nome, email, perfil, ativo, created_at FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(usuario);
});

router.post('/alterar-senha', autenticar, (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const db = getDb();

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
    if (!bcrypt.compareSync(senha_atual, usuario.senha_hash)) {
      return res.status(400).json({ erro: 'Senha atual incorreta' });
    }

    const novaHash = bcrypt.hashSync(nova_senha, 10);
    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(novaHash, req.usuario.id);
    registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, 'Alteração de senha');
    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
