-- 1. Alterar a coluna 'ativo' de integer para boolean na tabela usuarios
ALTER TABLE public.usuarios 
  ALTER COLUMN ativo DROP DEFAULT,
  ALTER COLUMN ativo TYPE boolean USING (ativo = 1),
  ALTER COLUMN ativo SET DEFAULT TRUE;

-- 2. Padronizar as datas para Timestamptz (com fuso horário)
ALTER TABLE public.usuarios ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE public.cursos ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE public.aulas ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE public.matriculas ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE public.logs_acesso ALTER COLUMN data_hora TYPE timestamptz;
ALTER TABLE public.certificados ALTER COLUMN emitido_em TYPE timestamptz;

-- 3. Adicionar restrição para o progresso não passar de 100%
ALTER TABLE public.matriculas ADD CONSTRAINT chk_progresso CHECK (progresso BETWEEN 0 AND 100);

-- 4. Impedir que o mesmo aluno se matricule duas vezes no mesmo curso
ALTER TABLE public.matriculas ADD CONSTRAINT matricula_aluno_curso_unique UNIQUE (aluno_id, curso_id);