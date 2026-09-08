-- SQL migration for Taskish tasks table (Postgres / Supabase)
CREATE TABLE IF NOT EXISTS public.tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  due timestamptz,
  priority text,
  tags text[],
  done boolean DEFAULT false,
  notified boolean DEFAULT false
);

-- Optional: create index on updated_at for sync queries
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks (updated_at);
