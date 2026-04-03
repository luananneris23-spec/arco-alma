-- ═══════════════════════════════════════════════════════
-- Arco & Alma — Schema
-- Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════

-- Tabela de progresso do usuário
create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  days         integer default 0,
  streak       integer default 0,
  exercises    integer default 0,
  dotz_done    integer default 0,
  sessions     integer default 0,
  current_study integer default 1,
  trophies     jsonb default '{}',
  weekly_log   jsonb default '[]',
  int_score    jsonb default '{"c":0,"w":0,"streak":0}',
  updated_at   timestamptz default now(),
  created_at   timestamptz default now(),

  unique(user_id)
);

-- Row Level Security: cada usuário só acessa seus próprios dados
alter table public.user_progress enable row level security;

create policy "Usuário vê seu próprio progresso"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Usuário salva seu próprio progresso"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza seu próprio progresso"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- Índice para busca rápida por user_id
create index if not exists idx_user_progress_user_id
  on public.user_progress(user_id);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_progress_updated_at
  before update on public.user_progress
  for each row execute function update_updated_at();
