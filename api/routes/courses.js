const express = require('express');
const { query } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

router.get('/', autenticar, async (req, res) => {
  const { perfil, id } = req.usuario;
  let sql;
  let params;

  if (perfil === 'admin') {
    sql = `
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id)::int AS total_aulas
      FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
      ORDER BY c.created_at DESC
    `;
    params = [];
  } else if (perfil === 'teacher') {
    sql = `
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id)::int AS total_aulas
      FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
      WHERE c.professor_id = $1
      ORDER BY c.created_at DESC
    `;
    params = [id];
  } else {
    sql = `
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id)::int AS total_aulas,
        COALESCE(m.progresso, 0) AS meu_progresso,
        CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END AS matriculado
      FROM cursos c
      LEFT JOIN usuarios u ON c.professor_id = u.id
      LEFT JOIN matriculas m ON m.curso_id = c.id AND m.aluno_id = $1
      ORDER BY c.created_at DESC
    `;
    params = [id];
  }

  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/:id', autenticar, async (req, res) => {
  const { rows } = await query(`
    SELECT c.*, u.nome AS professor_nome
    FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
    WHERE c.id = $1
  `, [req.params.id]);

  if (!rows[0]) return res.status(404).json({ erro: 'Curso não encontrado' });

  const { rows: aulas } = await query(
    'SELECT * FROM aulas WHERE curso_id = $1 ORDER BY ordem ASC', [req.params.id]
  );
  rows[0].aulas = aulas;

  if (req.usuario.perfil === 'student') {
    const { rows: mats } = await query(
      'SELECT * FROM matriculas WHERE aluno_id = $1 AND curso_id = $2',
      [req.usuario.id, req.params.id]
    );
    rows[0].matriculado = !!mats[0];
    rows[0].meu_progresso = mats[0] ? mats[0].progresso : 0;
  }

  res.json(rows[0]);
});

router.post('/', autenticar, autorizar('admin', 'teacher'), async (req, res) => {
  try {
    const { titulo, descricao, categoria, imagem_url } = req.body;

    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });

    const professor_id = req.usuario.perfil === 'teacher'
      ? req.usuario.id
      : (req.body.professor_id || req.usuario.id);

    const result = await query(`
      INSERT INTO cursos (titulo, descricao, professor_id, categoria, imagem_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [titulo, descricao || '', professor_id, categoria || '', imagem_url || '']);

    res.status(201).json({ id: result.rows[0].id, mensagem: 'Curso criado' });
  } catch (err) {
    console.error('Erro ao criar curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', autenticar, autorizar('admin', 'teacher'), async (req, res) => {
  try {
    const { titulo, descricao, categoria, imagem_url } = req.body;

    const { rows } = await query('SELECT * FROM cursos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && rows[0].professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode editar seus próprios cursos' });
    }

    await query(`
      UPDATE cursos SET titulo = COALESCE($1, titulo), descricao = COALESCE($2, descricao),
        categoria = COALESCE($3, categoria), imagem_url = COALESCE($4, imagem_url)
      WHERE id = $5
    `, [titulo || null, descricao !== undefined ? descricao : null, categoria || null, imagem_url || null, req.params.id]);

    res.json({ mensagem: 'Curso atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', autenticar, autorizar('admin', 'teacher'), async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM cursos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && rows[0].professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode excluir seus próprios cursos' });
    }

    await query('DELETE FROM cursos WHERE id = $1', [req.params.id]);
    res.json({ mensagem: 'Curso excluído' });
  } catch (err) {
    console.error('Erro ao excluir curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/aulas', autenticar, autorizar('admin', 'teacher'), async (req, res) => {
  try {
    const { titulo, conteudo, video_url, ordem } = req.body;

    const { rows: curso } = await query('SELECT * FROM cursos WHERE id = $1', [req.params.id]);
    if (!curso[0]) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && curso[0].professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const { rows: maxRow } = await query(
      'SELECT MAX(ordem) as max FROM aulas WHERE curso_id = $1', [req.params.id]
    );
    const novaOrdem = ordem !== undefined ? ordem : (maxRow[0].max || 0) + 1;

    const result = await query(`
      INSERT INTO aulas (curso_id, titulo, conteudo, video_url, ordem)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [req.params.id, titulo, conteudo || '', video_url || '', novaOrdem]);

    res.status(201).json({ id: result.rows[0].id, mensagem: 'Aula criada' });
  } catch (err) {
    console.error('Erro ao criar aula:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/matricular', autenticar, autorizar('student'), async (req, res) => {
  try {
    const { rows: curso } = await query('SELECT id FROM cursos WHERE id = $1', [req.params.id]);
    if (!curso[0]) return res.status(404).json({ erro: 'Curso não encontrado' });

    const { rows: existente } = await query(
      'SELECT id FROM matriculas WHERE aluno_id = $1 AND curso_id = $2',
      [req.usuario.id, req.params.id]
    );
    if (existente[0]) return res.status(409).json({ erro: 'Já matriculado' });

    await query(
      'INSERT INTO matriculas (aluno_id, curso_id) VALUES ($1, $2)',
      [req.usuario.id, req.params.id]
    );
    res.status(201).json({ mensagem: 'Matrícula realizada' });
  } catch (err) {
    console.error('Erro ao matricular:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:cursoId/progresso', autenticar, autorizar('student'), async (req, res) => {
  try {
    const { progresso } = req.body;

    if (progresso < 0 || progresso > 100) {
      return res.status(400).json({ erro: 'Progresso deve ser 0-100' });
    }

    const result = await query(`
      UPDATE matriculas SET progresso = $1 WHERE aluno_id = $2 AND curso_id = $3
    `, [progresso, req.usuario.id, req.params.cursoId]);

    if (result.rowCount === 0) return res.status(404).json({ erro: 'Matrícula não encontrada' });

    if (progresso === 100) {
      const { rows: certExistente } = await query(
        'SELECT id FROM certificados WHERE aluno_id = $1 AND curso_id = $2',
        [req.usuario.id, req.params.cursoId]
      );
      if (!certExistente[0]) {
        const { v4: uuidv4 } = require('uuid');
        await query(
          'INSERT INTO certificados (aluno_id, curso_id, codigo) VALUES ($1, $2, $3)',
          [req.usuario.id, req.params.cursoId, uuidv4().toUpperCase().slice(0, 8)]
        );
      }
    }

    res.json({ mensagem: 'Progresso atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id/certificado', autenticar, autorizar('student'), async (req, res) => {
  const { rows } = await query(`
    SELECT cert.*, c.titulo AS curso_titulo
    FROM certificados cert JOIN cursos c ON cert.curso_id = c.id
    WHERE cert.aluno_id = $1 AND cert.curso_id = $2
  `, [req.usuario.id, req.params.id]);

  if (!rows[0]) return res.status(404).json({ erro: 'Certificado não encontrado. Complete o curso primeiro.' });
  res.json(rows[0]);
});

module.exports = router;
