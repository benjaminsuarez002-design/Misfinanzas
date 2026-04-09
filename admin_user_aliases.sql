create extension if not exists pgcrypto;

create table if not exists public.admin_user_aliases (
  alias_key text primary key,
  uid text,
  email text,
  nombre text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists admin_user_aliases_uid_idx
  on public.admin_user_aliases (uid);

create index if not exists admin_user_aliases_email_idx
  on public.admin_user_aliases (email);

alter table public.admin_user_aliases disable row level security;
