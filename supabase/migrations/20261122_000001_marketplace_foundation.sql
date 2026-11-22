-- MANGO WORLD database foundation (not applied to any hosted database).
-- Client roles cannot write ledger rows, orders, or administrator records.

create extension if not exists pgcrypto;

do $$ begin
  create type public.mw_user_role as enum ('player', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mw_listing_status as enum ('draft', 'pending_review', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mw_order_status as enum ('created', 'pending_payment', 'paid', 'cancelled', 'refunded', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mw_ledger_direction as enum ('debit', 'credit');
exception when duplicate_object then null; end $$;

create table if not exists public.mw_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  role public.mw_user_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mw_wallet_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.mw_profiles(user_id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  chain_id bigint not null check (chain_id = 11155111),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','revoked')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, wallet_address)
);

create table if not exists public.mw_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.mw_profiles(user_id),
  title text not null check (char_length(title) between 3 and 90),
  description text not null check (char_length(description) between 10 and 3000),
  category text not null check (char_length(category) between 2 and 40),
  status public.mw_listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mw_listings_public_idx on public.mw_listings(status, created_at desc);
create index if not exists mw_listings_seller_idx on public.mw_listings(seller_id, created_at desc);

create table if not exists public.mw_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.mw_listings(id),
  buyer_id uuid not null references public.mw_profiles(user_id),
  seller_id uuid not null references public.mw_profiles(user_id),
  status public.mw_order_status not null default 'created',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create table if not exists public.mw_ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.mw_profiles(user_id),
  account_code text not null unique,
  account_type text not null check (account_type in ('user','treasury','escrow','system')),
  created_at timestamptz not null default now()
);

create table if not exists public.mw_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null,
  reference_id uuid,
  idempotency_key text not null unique,
  created_by uuid references public.mw_profiles(user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.mw_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.mw_ledger_transactions(id),
  account_id uuid not null references public.mw_ledger_accounts(id),
  direction public.mw_ledger_direction not null,
  amount_base_units numeric(78,0) not null check (amount_base_units > 0),
  created_at timestamptz not null default now()
);

create index if not exists mw_ledger_entries_account_idx on public.mw_ledger_entries(account_id, created_at);

create table if not exists public.mw_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.mw_profiles(user_id),
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Profile creation is automatic; role always defaults to player.
create or replace function public.mw_handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.mw_profiles(user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists mw_on_auth_user_created on auth.users;
create trigger mw_on_auth_user_created
after insert on auth.users
for each row execute procedure public.mw_handle_new_user();

alter table public.mw_profiles enable row level security;
alter table public.mw_wallet_links enable row level security;
alter table public.mw_listings enable row level security;
alter table public.mw_orders enable row level security;
alter table public.mw_ledger_accounts enable row level security;
alter table public.mw_ledger_transactions enable row level security;
alter table public.mw_ledger_entries enable row level security;
alter table public.mw_admin_audit_log enable row level security;

-- Profiles: users may read/update their own display name; role is not client-editable.
drop policy if exists mw_profiles_read_self on public.mw_profiles;
create policy mw_profiles_read_self on public.mw_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists mw_profiles_update_self on public.mw_profiles;
create policy mw_profiles_update_self on public.mw_profiles for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id and role = 'player');

-- Wallet links can be submitted by the owner but verification is reserved for trusted server/service role.
drop policy if exists mw_wallet_links_read_self on public.mw_wallet_links;
create policy mw_wallet_links_read_self on public.mw_wallet_links for select to authenticated using (auth.uid() = user_id);
drop policy if exists mw_wallet_links_insert_pending on public.mw_wallet_links;
create policy mw_wallet_links_insert_pending on public.mw_wallet_links for insert to authenticated
with check (auth.uid() = user_id and verification_status = 'pending' and verified_at is null);

-- Public can read published listings. Sellers can create drafts and edit only their own drafts.
drop policy if exists mw_listings_read_published on public.mw_listings;
create policy mw_listings_read_published on public.mw_listings for select to anon, authenticated
using (status = 'published' or seller_id = auth.uid());
drop policy if exists mw_listings_create_draft on public.mw_listings;
create policy mw_listings_create_draft on public.mw_listings for insert to authenticated
with check (seller_id = auth.uid() and status = 'draft');
drop policy if exists mw_listings_update_draft on public.mw_listings;
create policy mw_listings_update_draft on public.mw_listings for update to authenticated
using (seller_id = auth.uid() and status = 'draft')
with check (seller_id = auth.uid() and status = 'draft');

-- Orders, ledger and audit log are server-only. No client policies are intentionally created.
-- Apply privileged changes only through authenticated server functions using service role,
-- never expose the service-role key in a browser bundle.
