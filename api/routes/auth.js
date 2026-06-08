const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database');
const { autenticar, gerarToken } = require('../middleware/auth');

const router = express.Router();

async function registrarAuditoria(usuario_id, email, perfil, ip, user_agent, acao) {
  await query(
    `INSERT INTO auditoria (usuario_id, email, perfil, ip,      user_agent, acao)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, email, perfil, ip, user_agent, acao]
  );
}

async function registrarLogAcesso(usuario_id, ip, status, user_agent) {
  await query(
    `INSERT INTO logs_acesso (usuario_id, ip, status_login,      user_agent)
     VALUES ($1, $2, $3, $4)`,
    [usuario_id, ip, status, user_agent]
  );
}

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const { rows: existentes } = await query(
      'SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]
    );
    if (existentes[0]) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const hash = bcrypt.hashSync(senha, 10);
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome.trim(), email.toLowerCase().trim(), hash, 'student']
    );

    const usuario = {
      id: result.rows[0].id,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      perfil: 'student'
    };

    const token = gerarToken(usuario);
    await registrarLogAcesso(usuario.id, ip, 'sucesso', ua);
    await registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Cadastro realizado');

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

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const { rows } = await query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    const usuario = rows[0];

    if (!usuario) {
      await registrarAuditoria(null, email, null, ip, ua, 'Tentativa de login inválida');
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    if (!usuario.ativo) {
      await registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Login bloqueado - usuário inativo');
      return res.status(403).json({ erro: 'Usuário desativado. Contate o administrador.' });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      await registrarLogAcesso(usuario.id, ip, 'falha', ua);
      await registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Tentativa de login inválida');
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = gerarToken(usuario);
    await registrarLogAcesso(usuario.id, ip, 'sucesso', ua);
    await registrarAuditoria(usuario.id, usuario.email, usuario.perfil, ip, ua, 'Login realizado');

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

router.post('/logout', autenticar, async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';
  await registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, 'Logout');
  res.json({ mensagem: 'Logout registrado' });
});

router.get('/me', autenticar, async (req, res) => {
  const { rows } = await query(
    'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios WHERE id = $1',
    [req.usuario.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(rows[0]);
});

router.post('/alterar-senha', autenticar, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    const { rows } = await query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (!bcrypt.compareSync(senha_atual, rows[0].senha_hash)) {
      return res.status(400).json({ erro: 'Senha atual incorreta' });
    }

    const novaHash = bcrypt.hashSync(nova_senha, 10);
    await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaHash, req.usuario.id]);
    await registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua, 'Alteração de senha');
    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
