-- Striking Details — Book
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

create table if not exists contacts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text,
  phone        text,
  email        text,
  category     text,
  status       text default 'New',
  source       text,
  met_at       text,
  met_on       date,
  next_step    text,
  next_due     date,
  quote_amount numeric default 0,
  plan_amount  numeric default 0,
  vehicles     jsonb  default '[]'::jsonb,
  notes        text,
  card_url     text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  updated_by   text
);

create table if not exists ledger (
  id          uuid primary key default gen_random_uuid(),
  entry_date  date not null default current_date,
  kind        text not null check (kind in ('revenue','expense','equipment','capital')),
  amount      numeric not null default 0,
  category    text,
  memo        text,
  contact_id  uuid references contacts(id) on delete set null,
  vehicles    int   default 0,
  hours       numeric default 0,
  paid        boolean default true,
  receipt_url text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  updated_by  text
);

create table if not exists invoices (
  id           uuid primary key default gen_random_uuid(),
  no           text,
  invoice_date date default current_date,
  terms        text default 'Due on receipt',
  to_name      text,
  to_company   text,
  attn         text,
  to_addr      text,
  to_city      text,
  items        jsonb default '[]'::jsonb,
  notes        text,
  total        numeric default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  updated_by   text
);

create table if not exists settings (
  key   text primary key,
  value jsonb
);

create index if not exists ledger_date_idx    on ledger (entry_date desc);
create index if not exists ledger_contact_idx on ledger (contact_id);
create index if not exists contacts_due_idx   on contacts (next_due);

-- Row level security. Nothing is readable without a login.
alter table contacts enable row level security;
alter table ledger   enable row level security;
alter table invoices enable row level security;
alter table settings enable row level security;

-- One shared book: any signed-in account sees it. Safe only because sign-ups
-- are disabled, so the only accounts that exist are the ones you create.
do $$
declare t text;
begin
  foreach t in array array['contacts','ledger','invoices','settings'] loop
    execute format('drop policy if exists "signed in full access" on %I', t);
    execute format(
      'create policy "signed in full access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- keep updated_at honest
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['contacts','ledger','invoices'] loop
    execute format('drop trigger if exists touch_%I on %I', t, t);
    execute format(
      'create trigger touch_%I before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;
