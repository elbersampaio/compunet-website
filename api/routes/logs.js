const express = require('express');
const { query } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

router.get('/acessos', autenticar, autorizar('admin'), async (req, res) => {
  const { usuario_id, data_inicio, data_fim, ip, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let idx = 1;

  let sql = `SELECT la.*, u.nome, u.email FROM logs_acesso la LEFT JOIN usuarios u ON la.usuario_id = u.id WHERE 1=1`;
  let countSql = `SELECT COUNT(*)::int as total FROM logs_acesso la LEFT JOIN usuarios u ON la.usuario_id = u.id WHERE 1=1`;

  if (usuario_id) {
    sql += ` AND la.usuario_id = $${idx}`;
    countSql += ` AND la.usuario_id = $${idx++}`;
    params.push(usuario_id);
  }
  if (ip) {
    sql += ` AND la.ip LIKE $${idx}`;
    countSql += ` AND la.ip LIKE $${idx++}`;
    params.push(`%${ip}%`);
  }
  if (data_inicio) {
    sql += ` AND la.data_hora >= $${idx}`;
    countSql += ` AND la.data_hora >= $${idx++}`;
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ` AND la.data_hora <= $${idx}`;
    countSql += ` AND la.data_hora <= $${idx++}`;
    params.push(data_fim);
  }

  sql += ` ORDER BY la.data_hora DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(parseInt(limit), offset);

  const { rows: logs } = await query(sql, params);
  const limitParam = parseInt(limit);
  const offsetParam = offset;
  const countParams = params.slice(0, params.length - 2);
  const { rows: countResult } = await query(countSql, countParams);
  const total = countResult[0].total;

  res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / limitParam) });
});

router.get('/auditoria', autenticar, autorizar('admin'), async (req, res) => {
  const { usuario_id, acao, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let idx = 1;

  let sql = `SELECT * FROM auditoria WHERE 1=1`;
  let countSql = `SELECT COUNT(*)::int as total FROM auditoria WHERE 1=1`;

  if (usuario_id) {
    sql += ` AND usuario_id = $${idx}`;
    countSql += ` AND usuario_id = $${idx++}`;
    params.push(usuario_id);
  }
  if (acao) {
    sql += ` AND acao LIKE $${idx}`;
    countSql += ` AND acao LIKE $${idx++}`;
    params.push(`%${acao}%`);
  }
  if (data_inicio) {
    sql += ` AND data_hora >= $${idx}`;
    countSql += ` AND data_hora >= $${idx++}`;
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ` AND data_hora <= $${idx}`;
    countSql += ` AND data_hora <= $${idx++}`;
    params.push(data_fim);
  }

  sql += ` ORDER BY data_hora DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(parseInt(limit), offset);

  const { rows: logs } = await query(sql, params);
  const countParams = params.slice(0, params.length - 2);
  const { rows: countResult } = await query(countSql, countParams);
  const total = countResult[0].total;

  res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.get('/auditoria/exportar', autenticar, autorizar('admin'), async (req, res) => {
  const { rows: logs } = await query('SELECT * FROM auditoria ORDER BY data_hora DESC LIMIT 10000');

  const csvHeader = 'ID,Usuário ID,Email,Perfil,IP,User Agent,Data/Hora,Ação\n';
  const csvRows = logs.map(l =>
    `${l.id},${l.usuario_id || ''},"${l.email || ''}","${l.perfil || ''}","${l.ip || ''}","${(l.user_agent || '').replace(/"/g, '""')}","${l.data_hora}","${l.acao}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=auditoria.csv');
  res.send('\uFEFF' + csvHeader + csvRows);
});

module.exports = router;
