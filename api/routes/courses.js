const express = require('express');
const { getDb } = require('../database');
const { autenticar } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

const router = express.Router();

router.get('/', autenticar, (req, res) => {
  const db = getDb();
  const { perfil, id } = req.usuario;

  let cursos;
  if (perfil === 'admin') {
    cursos = db.prepare(`
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) AS total_aulas
      FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
      ORDER BY c.created_at DESC
    `).all();
  } else if (perfil === 'teacher') {
    cursos = db.prepare(`
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) AS total_aulas
      FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
      WHERE c.professor_id = ?
      ORDER BY c.created_at DESC
    `).all(id);
  } else {
    cursos = db.prepare(`
      SELECT c.*, u.nome AS professor_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) AS total_aulas,
        COALESCE(m.progresso, 0) AS meu_progresso,
        CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END AS matriculado
      FROM cursos c
      LEFT JOIN usuarios u ON c.professor_id = u.id
      LEFT JOIN matriculas m ON m.curso_id = c.id AND m.aluno_id = ?
      ORDER BY c.created_at DESC
    `).all(id);
  }

  res.json(cursos);
});

router.get('/:id', autenticar, (req, res) => {
  const db = getDb();
  const curso = db.prepare(`
    SELECT c.*, u.nome AS professor_nome
    FROM cursos c LEFT JOIN usuarios u ON c.professor_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

  const aulas = db.prepare('SELECT * FROM aulas WHERE curso_id = ? ORDER BY ordem ASC').all(req.params.id);
  curso.aulas = aulas;

  if (req.usuario.perfil === 'student') {
    const matricula = db.prepare('SELECT * FROM matriculas WHERE aluno_id = ? AND curso_id = ?').get(req.usuario.id, req.params.id);
    curso.matriculado = !!matricula;
    curso.meu_progresso = matricula ? matricula.progresso : 0;
  }

  res.json(curso);
});

router.post('/', autenticar, autorizar('admin', 'teacher'), (req, res) => {
  try {
    const { titulo, descricao, categoria, imagem_url } = req.body;
    const db = getDb();

    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });

    const professor_id = req.usuario.perfil === 'teacher' ? req.usuario.id : (req.body.professor_id || req.usuario.id);

    const result = db.prepare(`
      INSERT INTO cursos (titulo, descricao, professor_id, categoria, imagem_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(titulo, descricao || '', professor_id, categoria || '', imagem_url || '');

    res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Curso criado' });
  } catch (err) {
    console.error('Erro ao criar curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', autenticar, autorizar('admin', 'teacher'), (req, res) => {
  try {
    const { titulo, descricao, categoria, imagem_url } = req.body;
    const db = getDb();

    const curso = db.prepare('SELECT * FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && curso.professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode editar seus próprios cursos' });
    }

    db.prepare(`
      UPDATE cursos SET titulo = COALESCE(?, titulo), descricao = COALESCE(?, descricao),
        categoria = COALESCE(?, categoria), imagem_url = COALESCE(?, imagem_url)
      WHERE id = ?
    `).run(titulo || null, descricao !== undefined ? descricao : null, categoria || null, imagem_url || null, req.params.id);

    res.json({ mensagem: 'Curso atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', autenticar, autorizar('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const curso = db.prepare('SELECT * FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && curso.professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode excluir seus próprios cursos' });
    }

    db.prepare('DELETE FROM cursos WHERE id = ?').run(req.params.id);
    res.json({ mensagem: 'Curso excluído' });
  } catch (err) {
    console.error('Erro ao excluir curso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/aulas', autenticar, autorizar('admin', 'teacher'), (req, res) => {
  try {
    const { titulo, conteudo, video_url, ordem } = req.body;
    const db = getDb();

    const curso = db.prepare('SELECT * FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (req.usuario.perfil === 'teacher' && curso.professor_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const maxOrdem = db.prepare('SELECT MAX(ordem) as max FROM aulas WHERE curso_id = ?').get(req.params.id);
    const novaOrdem = ordem !== undefined ? ordem : (maxOrdem.max || 0) + 1;

    const result = db.prepare(`
      INSERT INTO aulas (curso_id, titulo, conteudo, video_url, ordem)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, titulo, conteudo || '', video_url || '', novaOrdem);

    res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Aula criada' });
  } catch (err) {
    console.error('Erro ao criar aula:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/matricular', autenticar, autorizar('student'), (req, res) => {
  try {
    const db = getDb();
    const curso = db.prepare('SELECT id FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    const existente = db.prepare('SELECT id FROM matriculas WHERE aluno_id = ? AND curso_id = ?').get(req.usuario.id, req.params.id);
    if (existente) return res.status(409).json({ erro: 'Já matriculado' });

    db.prepare('INSERT INTO matriculas (aluno_id, curso_id) VALUES (?, ?)').run(req.usuario.id, req.params.id);
    res.status(201).json({ mensagem: 'Matrícula realizada' });
  } catch (err) {
    console.error('Erro ao matricular:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:cursoId/progresso', autenticar, autorizar('student'), (req, res) => {
  try {
    const { progresso } = req.body;
    const db = getDb();

    if (progresso < 0 || progresso > 100) {
      return res.status(400).json({ erro: 'Progresso deve ser 0-100' });
    }

    const result = db.prepare(`
      UPDATE matriculas SET progresso = ? WHERE aluno_id = ? AND curso_id = ?
    `).run(progresso, req.usuario.id, req.params.cursoId);

    if (result.changes === 0) return res.status(404).json({ erro: 'Matrícula não encontrada' });

    if (progresso === 100) {
      const db2 = getDb();
      const { v4: uuidv4 } = require('uuid');
      const existente = db2.prepare('SELECT id FROM certificados WHERE aluno_id = ? AND curso_id = ?').get(req.usuario.id, req.params.cursoId);
      if (!existente) {
        db2.prepare('INSERT INTO certificados (aluno_id, curso_id, codigo) VALUES (?, ?, ?)').run(
          req.usuario.id, req.params.cursoId, uuidv4().toUpperCase().slice(0, 8)
        );
      }
    }

    res.json({ mensagem: 'Progresso atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id/certificado', autenticar, autorizar('student'), (req, res) => {
  const db = getDb();
  const cert = db.prepare(`
    SELECT cert.*, c.titulo AS curso_titulo
    FROM certificados cert JOIN cursos c ON cert.curso_id = c.id
    WHERE cert.aluno_id = ? AND cert.curso_id = ?
  `).get(req.usuario.id, req.params.id);

  if (!cert) return res.status(404).json({ erro: 'Certificado não encontrado. Complete o curso primeiro.' });
  res.json(cert);
});

module.exports = router;
