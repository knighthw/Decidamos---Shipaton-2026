-- Decidamos — tabla de salas para el servidor multi-celular (Fase 1).
-- Pegar entero en Supabase → SQL Editor → New query → Run.

create table if not exists salas (
  codigo      text primary key,
  datos       jsonb not null,
  actualizada timestamptz not null default now()
);

-- RLS activado pero abierto a propósito (decisión tomada: código = llave,
-- sin cuentas ni login para entrar a una sala — ver conversación de diseño).
alter table salas enable row level security;

create policy "abierto_lectura" on salas
  for select using (true);

create policy "abierto_escritura" on salas
  for insert with check (true);

create policy "abierto_actualizacion" on salas
  for update using (true) with check (true);

-- Habilita que los cambios en esta tabla lleguen en vivo a los dos celulares.
alter publication supabase_realtime add table salas;
