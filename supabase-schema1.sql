-- 1. Padronização de UUIDs ou IDs sequenciais normais
-- 2. Correção de Timestamps para TIMESTAMPTZ
-- 3. Mudança de 'ativo' para BOOLEAN

CREATE TABLE public.usuarios (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY, -- Padrão moderno do Postgres (substitui SERIAL/nextval manual)
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('student', 'teacher', 'admin')),
  ativo boolean NOT NULL DEFAULT TRUE, -- Mudado para BOOLEAN
  created_at timestamptz NOT NULL DEFAULT now(), -- Padronizado para TIMESTAMPTZ
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

CREATE TABLE public.cursos (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  titulo text NOT NULL,
  descricao text,
  professor_id integer,
  categoria text,
  imagem_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cursos_pkey PRIMARY KEY (id),
  CONSTRAINT cursos_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL -- Se o professor sair, o curso não é deletado
);

CREATE TABLE public.aulas (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  curso_id integer NOT NULL,
  titulo text NOT NULL,
  conteudo text,
  video_url text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aulas_pkey PRIMARY KEY (id),
  CONSTRAINT aulas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE -- Se o curso sumir, as aulas somem
);

CREATE TABLE public.matriculas (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  aluno_id integer NOT NULL,
  curso_id integer NOT NULL,
  progresso integer NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100), -- Garante progresso de 0 a 100%
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matriculas_pkey PRIMARY KEY (id),
  CONSTRAINT matriculas_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT matriculas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE,
  CONSTRAINT matricula_aluno_curso_unique UNIQUE (aluno_id, curso_id) -- Impede o mesmo aluno de se matricular duas vezes no mesmo curso
);

CREATE TABLE public.logs_acesso (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  usuario_id integer,
  ip text,
  data_hora timestamptz NOT NULL DEFAULT now(),
  status_login text,
  user_agent text,
  CONSTRAINT logs_acesso_pkey PRIMARY KEY (id),
  CONSTRAINT logs_acesso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE TABLE public.certificados (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  aluno_id integer NOT NULL,
  curso_id integer NOT NULL,
  codigo text NOT NULL UNIQUE,
  emitido_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certificados_pkey PRIMARY KEY (id),
  CONSTRAINT certificados_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.usuarios(id),
  CONSTRAINT certificados_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id)
);

CREATE TABLE public.auditoria (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
  usuario_id integer,
  email text,
  perfil text,
  ip text,
  user_agent text,
  data_hora timestamptz NOT NULL DEFAULT now(),
  acao text,
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);