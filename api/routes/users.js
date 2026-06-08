const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

async function registrarAuditoria(usuario_id, email, perfil, ip, user_agent, acao) {
  await query(
    `INSERT INTO auditoria (usuario_id, email, perfil, ip, user_agent, acao)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, email, perfil, ip, user_agent, acao]
  );
}

router.get('/', autenticar, autorizar('admin'), async (req, res) => {
  const { rows } = await query(
    'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.post('/', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
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
      [nome.trim(), email.toLowerCase().trim(), hash, perfil]
    );

    await registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua,
      `Criação de usuário: ${email} (${perfil})`);

    res.status(201).json({
      id: result.rows[0].id,
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

router.put('/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { nome, email, perfil, ativo } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    const updates = [];
    const params = [];
    let idx = 1;

    if (nome !== undefined) { updates.push(`nome = $${idx++}`); params.push(nome.trim()); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()); }
    if (perfil !== undefined) { updates.push(`perfil = $${idx++}`); params.push(perfil); }
    if (ativo !== undefined) { updates.push(`ativo = $${idx++}`); params.push(ativo); }

    if (updates.length === 0) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });

    params.push(req.params.id);
    await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${idx}`, params);

    await registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua,
      `Alteração de usuário ID:${req.params.id}`);

    res.json({ mensagem: 'Usuário atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    const { rows } = await query('SELECT email, perfil FROM usuarios WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });

    await query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);

    await registrarAuditoria(req.usuario.id, req.usuario.email, req.usuario.perfil, ip, ua,
      `Exclusão de usuário: ${rows[0].email} (${rows[0].perfil})`);

    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/professores', autenticar, async (req, res) => {
  const { rows } = await query(
    'SELECT id, nome, email FROM usuarios WHERE perfil = $1 AND ativo = true', ['teacher']
  );
  res.json(rows);
});

router.get('/alunos', autenticar, autorizar('admin', 'teacher'), async (req, res) => {
  const { rows } = await query(
    'SELECT id, nome, email, created_at FROM usuarios WHERE perfil = $1 AND ativo = true', ['student']
  );
  res.json(rows);
});

module.exports = router;
