INSERT INTO cursos (id, titulo, descricao, categoria)
VALUES
  (101, 'Python para Iniciantes', 'Curso introdutório de Python.', 'Programação'),
  (102, 'Banco de Dados SQL', 'Fundamentos de bancos de dados relacionais.', 'Dados'),
  (103, 'Desenvolvimento Web', 'HTML, CSS e JavaScript do básico ao intermediário.', 'Web')
ON CONFLICT (id) DO NOTHING;

INSERT INTO aulas (id, curso_id, titulo, conteudo, video_url, ordem, created_at)
VALUES
  (1, 101, 'Introdução ao Python', 'Conceitos básicos e sintaxe da linguagem.', 'https://video.plataforma.com/aula1', 1, '2026-06-01 10:00:00'),
  (2, 101, 'Variáveis e Tipos de Dados', 'Entendendo strings, ints, floats e booleanos.', 'https://video.plataforma.com/aula2', 2, '2026-06-02 11:15:00'),
  (3, 101, 'Estruturas Condicionais', 'Como utilizar if, elif e else em Python.', 'https://video.plataforma.com/aula3', 3, '2026-06-03 09:30:00'),
  (4, 102, 'Fundamentos de Bancos de Dados', 'O que é um banco de dados relacional e SQL.', 'https://video.plataforma.com/aula4', 1, '2026-06-04 14:00:00'),
  (5, 102, 'Comandos SELECT Básicos', 'Filtrando e ordenando dados com SQL.', 'https://video.plataforma.com/aula5', 2, '2026-06-05 16:45:00'),
  (6, 103, 'HTML5 e a Estrutura Web', 'Criando a primeira página web estruturada.', 'https://video.plataforma.com/aula6', 1, '2026-06-06 08:00:00'),
  (7, 103, 'Estilizando com CSS3', 'Cores, fontes e seletores básicos na web.', 'https://video.plataforma.com/aula7', 2, '2026-06-07 10:30:00'),
  (8, 103, 'Introdução ao JavaScript', 'Tornando a sua página web interativa.', 'https://video.plataforma.com/aula8', 3, '2026-06-08 11:00:00')
ON CONFLICT (id) DO NOTHING;
