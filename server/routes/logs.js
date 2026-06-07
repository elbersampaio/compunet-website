const express = require('express');
const { getDb } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

router.get('/acessos', autenticar, autorizar('admin'), (req, res) => {
  const db = getDb();
  const { usuario_id, data_inicio, data_fim, ip, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT la.*, u.nome, u.email FROM logs_acesso la LEFT JOIN usuarios u ON la.usuario_id = u.id WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM logs_acesso la LEFT JOIN usuarios u ON la.usuario_id = u.id WHERE 1=1';
  const params = [];

  if (usuario_id) {
    sql += ' AND la.usuario_id = ?';
    countSql += ' AND la.usuario_id = ?';
    params.push(usuario_id);
  }
  if (ip) {
    sql += ' AND la.ip LIKE ?';
    countSql += ' AND la.ip LIKE ?';
    params.push(`%${ip}%`);
  }
  if (data_inicio) {
    sql += ' AND la.data_hora >= ?';
    countSql += ' AND la.data_hora >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND la.data_hora <= ?';
    countSql += ' AND la.data_hora <= ?';
    params.push(data_fim);
  }

  sql += ' ORDER BY la.data_hora DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const logs = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...params.slice(0, params.length - 2));

  res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.get('/auditoria', autenticar, autorizar('admin'), (req, res) => {
  const db = getDb();
  const { usuario_id, acao, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM auditoria WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM auditoria WHERE 1=1';
  const params = [];

  if (usuario_id) {
    sql += ' AND usuario_id = ?';
    countSql += ' AND usuario_id = ?';
    params.push(usuario_id);
  }
  if (acao) {
    sql += ' AND acao LIKE ?';
    countSql += ' AND acao LIKE ?';
    params.push(`%${acao}%`);
  }
  if (data_inicio) {
    sql += ' AND data_hora >= ?';
    countSql += ' AND data_hora >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    sql += ' AND data_hora <= ?';
    countSql += ' AND data_hora <= ?';
    params.push(data_fim);
  }

  sql += ' ORDER BY data_hora DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const logs = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...params.slice(0, params.length - 2));

  res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

router.get('/auditoria/exportar', autenticar, autorizar('admin'), (req, res) => {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM auditoria ORDER BY data_hora DESC LIMIT 10000').all();

  const csvHeader = 'ID,Usuário ID,Email,Perfil,IP,User Agent,Data/Hora,Ação\n';
  const csvRows = logs.map(l =>
    `${l.id},${l.usuario_id || ''},"${l.email || ''}","${l.perfil || ''}","${l.ip || ''}","${(l.user_agent || '').replace(/"/g, '""')}","${l.data_hora}","${l.acao}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=auditoria.csv');
  res.send('\uFEFF' + csvHeader + csvRows);
});

module.exports = router;
