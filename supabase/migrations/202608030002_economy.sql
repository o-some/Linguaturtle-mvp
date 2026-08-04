create extension if not exists pgcrypto with schema extensions;

create table public.store_products (
  product_id text primary key,
  shells integer not null check (shells > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.store_products (product_id, shells) values
  ('com.linguaturtle.shells.150', 150),
  ('com.linguaturtle.shells.450', 450),
  ('com.linguaturtle.shells.1000', 1000)
on conflict (product_id) do update set shells = excluded.shells, active = true;

create table public.shop_items (
  item_id text primary key,
  item_type text not null check (item_type in ('mode', 'booster', 'home', 'word')),
  shell_cost integer not null check (shell_cost >= 0),
  consumable boolean not null default false,
  active boolean not null default true
);

insert into public.shop_items (item_id, item_type, shell_cost, consumable) values
  ('mode:sentence', 'mode', 80, false),
  ('mode:memory', 'mode', 120, false),
  ('mode:speed', 'mode', 160, false),
  ('booster:doubleXp', 'booster', 60, true),
  ('booster:hints', 'booster', 25, true),
  ('booster:jumps', 'booster', 35, true),
  ('home:plant', 'home', 25, false),
  ('home:bed', 'home', 60, false),
  ('home:lamp', 'home', 35, false),
  ('home:books', 'home', 40, false),
  ('home:aquarium', 'home', 90, false),
  ('home:crown', 'home', 110, false)
on conflict (item_id) do update
set item_type = excluded.item_type,
    shell_cost = excluded.shell_cost,
    consumable = excluded.consumable,
    active = true;

create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  reversal_debt bigint not null default 0 check (reversal_debt >= 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'welcome', 'purchase', 'rewarded_ad', 'gameplay', 'spend', 'refund', 'admin'
  )),
  amount bigint not null check (amount <> 0),
  external_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (kind, external_id)
);

create index wallet_ledger_user_created_idx
  on public.wallet_ledger (user_id, created_at desc);

create table public.purchase_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  transaction_id text not null,
  product_id text not null references public.store_products(product_id),
  shells integer not null check (shells > 0),
  status text not null check (status in ('verified', 'refunded', 'revoked')),
  store_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  reversed_at timestamptz,
  unique (platform, transaction_id)
);

create index purchase_transactions_user_idx
  on public.purchase_transactions (user_id, verified_at desc);

create table public.inventory_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null check (item_type in ('mode', 'booster', 'home', 'word')),
  quantity integer not null default 1 check (quantity >= 0),
  acquired_by text not null check (acquired_by in ('shells', 'migration', 'admin')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.ad_reward_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'kidoz',
  audience text not null check (audience in ('child', 'adult')),
  reward_amount integer not null default 15 check (reward_amount = 15),
  status text not null default 'issued' check (status in ('issued', 'completed', 'expired')),
  provider_proof jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  completed_at timestamptz
);

create index ad_reward_tickets_user_completed_idx
  on public.ad_reward_tickets (user_id, completed_at desc)
  where status = 'completed';

create table public.economy_remote_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.economy_remote_config (key, value) values
  ('ios_rewarded_ads_enabled', 'false'::jsonb),
  ('android_rewarded_ads_enabled', 'true'::jsonb),
  ('reward_amount', '15'::jsonb),
  ('reward_limit_24h', '3'::jsonb)
on conflict (key) do nothing;

alter table public.store_products enable row level security;
alter table public.shop_items enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.purchase_transactions enable row level security;
alter table public.inventory_entitlements enable row level security;
alter table public.ad_reward_tickets enable row level security;
alter table public.economy_remote_config enable row level security;

create policy "Catalog is publicly readable"
on public.store_products for select to anon, authenticated
using (active);

create policy "Shop items are publicly readable"
on public.shop_items for select to anon, authenticated
using (active);

create policy "Users can read their wallet"
on public.wallets for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their wallet ledger"
on public.wallet_ledger for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their purchases"
on public.purchase_transactions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their entitlements"
on public.inventory_entitlements for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their ad tickets"
on public.ad_reward_tickets for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Economy config is publicly readable"
on public.economy_remote_config for select to anon, authenticated
using (true);

create or replace function public.ensure_wallet()
returns public.wallets
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  result public.wallets;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  insert into public.wallets (user_id, balance)
  values (current_user_id, 150)
  on conflict (user_id) do nothing;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    current_user_id,
    'welcome',
    150,
    'welcome:' || current_user_id::text,
    jsonb_build_object('version', 1)
  )
  on conflict (kind, external_id) do nothing;

  select * into result from public.wallets where user_id = current_user_id;
  return result;
end;
$$;

create or replace function public.wallet_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  wallet_row public.wallets;
  entitlement_rows jsonb;
  ad_count integer;
  config_rows jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  wallet_row := public.ensure_wallet();

  select coalesce(jsonb_agg(to_jsonb(e) order by e.item_id), '[]'::jsonb)
  into entitlement_rows
  from public.inventory_entitlements e
  where e.user_id = current_user_id and e.quantity > 0;

  select count(*)::integer into ad_count
  from public.ad_reward_tickets t
  where t.user_id = current_user_id
    and t.status = 'completed'
    and t.completed_at > now() - interval '24 hours';

  select coalesce(jsonb_object_agg(c.key, c.value), '{}'::jsonb)
  into config_rows
  from public.economy_remote_config c;

  return jsonb_build_object(
    'wallet', jsonb_build_object(
      'balance', greatest(wallet_row.balance, 0),
      'reversalDebt', wallet_row.reversal_debt,
      'revision', wallet_row.revision,
      'updatedAt', wallet_row.updated_at
    ),
    'entitlements', entitlement_rows,
    'adRemaining', greatest(0, 3 - ad_count),
    'config', config_rows
  );
end;
$$;

create or replace function public.spend_shells(
  p_item_id text,
  p_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  wallet_row public.wallets;
  catalog_row public.shop_items;
  item_kind text;
  item_cost integer;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  perform public.ensure_wallet();

  if exists (
    select 1 from public.wallet_ledger
    where kind = 'spend' and external_id = p_event_id::text and user_id = current_user_id
  ) then
    return public.wallet_snapshot();
  end if;

  select * into catalog_row
  from public.shop_items
  where item_id = p_item_id and active;

  if found then
    item_kind := catalog_row.item_type;
    item_cost := catalog_row.shell_cost;
  elsif p_item_id ~ '^word:[a-z0-9_-]+$' then
    item_kind := 'word';
    item_cost := 1;
  else
    raise exception 'unknown_shop_item' using errcode = '22023';
  end if;

  select * into wallet_row
  from public.wallets
  where user_id = current_user_id
  for update;

  if wallet_row.balance < item_cost then
    raise exception 'insufficient_shells' using errcode = '22003';
  end if;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    current_user_id,
    'spend',
    -item_cost,
    p_event_id::text,
    jsonb_build_object('itemId', p_item_id)
  );

  update public.wallets
  set balance = balance - item_cost,
      revision = revision + 1,
      updated_at = now()
  where user_id = current_user_id;

  insert into public.inventory_entitlements (
    user_id, item_id, item_type, quantity, acquired_by
  )
  values (
    current_user_id, p_item_id, item_kind, 1, 'shells'
  )
  on conflict (user_id, item_id) do update
  set quantity = case
        when item_kind = 'booster'
          then public.inventory_entitlements.quantity + 1
        else greatest(public.inventory_entitlements.quantity, 1)
      end,
      updated_at = now();

  return public.wallet_snapshot();
end;
$$;

create or replace function public.create_ad_reward_ticket(p_audience text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  completed_count integer;
  ticket public.ad_reward_tickets;
  next_available timestamptz;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if p_audience not in ('child', 'adult') then
    raise exception 'invalid_audience' using errcode = '22023';
  end if;

  perform public.ensure_wallet();

  update public.ad_reward_tickets
  set status = 'expired'
  where user_id = current_user_id and status = 'issued' and expires_at <= now();

  select count(*)::integer, min(completed_at) + interval '24 hours'
  into completed_count, next_available
  from public.ad_reward_tickets
  where user_id = current_user_id
    and status = 'completed'
    and completed_at > now() - interval '24 hours';

  if completed_count >= 3 then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'nextAvailableAt', next_available
    );
  end if;

  insert into public.ad_reward_tickets (user_id, audience)
  values (current_user_id, p_audience)
  returning * into ticket;

  return jsonb_build_object(
    'allowed', true,
    'ticketId', ticket.id,
    'expiresAt', ticket.expires_at,
    'rewardAmount', ticket.reward_amount,
    'remaining', 3 - completed_count
  );
end;
$$;

create or replace function public.credit_verified_purchase(
  p_user_id uuid,
  p_platform text,
  p_transaction_id text,
  p_product_id text,
  p_store_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  shell_amount integer;
  existing public.purchase_transactions;
  wallet_row public.wallets;
begin
  if p_platform not in ('ios', 'android') then
    raise exception 'invalid_platform' using errcode = '22023';
  end if;

  select shells into shell_amount
  from public.store_products
  where product_id = p_product_id and active;
  if shell_amount is null then
    raise exception 'unknown_store_product' using errcode = '22023';
  end if;

  select * into existing
  from public.purchase_transactions
  where platform = p_platform and transaction_id = p_transaction_id;

  if found then
    if existing.user_id <> p_user_id or existing.product_id <> p_product_id then
      raise exception 'transaction_owner_mismatch' using errcode = '42501';
    end if;
    select * into wallet_row from public.wallets where user_id = p_user_id;
    return jsonb_build_object(
      'credited', false,
      'balance', greatest(wallet_row.balance, 0),
      'revision', wallet_row.revision
    );
  end if;

  insert into public.wallets (user_id, balance)
  values (p_user_id, 150)
  on conflict (user_id) do nothing;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    p_user_id, 'welcome', 150, 'welcome:' || p_user_id::text,
    jsonb_build_object('version', 1)
  )
  on conflict (kind, external_id) do nothing;

  select * into wallet_row
  from public.wallets
  where user_id = p_user_id
  for update;

  insert into public.purchase_transactions (
    user_id, platform, transaction_id, product_id, shells, status, store_payload
  )
  values (
    p_user_id, p_platform, p_transaction_id, p_product_id, shell_amount, 'verified',
    coalesce(p_store_payload, '{}'::jsonb)
  );

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    p_user_id,
    'purchase',
    shell_amount,
    p_platform || ':' || p_transaction_id,
    jsonb_build_object('productId', p_product_id, 'platform', p_platform)
  );

  update public.wallets
  set balance = balance + greatest(0, shell_amount - reversal_debt),
      reversal_debt = greatest(0, reversal_debt - shell_amount),
      revision = revision + 1,
      updated_at = now()
  where user_id = p_user_id
  returning * into wallet_row;

  return jsonb_build_object(
    'credited', true,
    'shells', shell_amount,
    'balance', greatest(wallet_row.balance, 0),
    'revision', wallet_row.revision
  );
end;
$$;

create or replace function public.complete_ad_reward(
  p_user_id uuid,
  p_ticket_id uuid,
  p_provider_proof jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ticket public.ad_reward_tickets;
  wallet_row public.wallets;
  completed_count integer;
begin
  select * into ticket
  from public.ad_reward_tickets
  where id = p_ticket_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'unknown_ad_ticket' using errcode = '22023';
  end if;

  if ticket.status = 'completed' then
    select * into wallet_row from public.wallets where user_id = p_user_id;
    return jsonb_build_object(
      'credited', false,
      'balance', greatest(wallet_row.balance, 0),
      'revision', wallet_row.revision
    );
  end if;

  if ticket.status <> 'issued' or ticket.expires_at <= now() then
    update public.ad_reward_tickets set status = 'expired' where id = p_ticket_id;
    raise exception 'ad_ticket_expired' using errcode = '22023';
  end if;

  select * into wallet_row
  from public.wallets
  where user_id = p_user_id
  for update;

  select count(*)::integer into completed_count
  from public.ad_reward_tickets
  where user_id = p_user_id
    and status = 'completed'
    and completed_at > now() - interval '24 hours';
  if completed_count >= 3 then
    raise exception 'ad_daily_limit' using errcode = '22003';
  end if;

  update public.ad_reward_tickets
  set status = 'completed',
      completed_at = now(),
      provider_proof = coalesce(p_provider_proof, '{}'::jsonb)
  where id = p_ticket_id;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    p_user_id, 'rewarded_ad', ticket.reward_amount, p_ticket_id::text,
    jsonb_build_object('provider', ticket.provider, 'audience', ticket.audience)
  );

  update public.wallets
  set balance = balance + greatest(0, ticket.reward_amount - reversal_debt),
      reversal_debt = greatest(0, reversal_debt - ticket.reward_amount),
      revision = revision + 1,
      updated_at = now()
  where user_id = p_user_id
  returning * into wallet_row;

  return jsonb_build_object(
    'credited', true,
    'shells', ticket.reward_amount,
    'balance', greatest(wallet_row.balance, 0),
    'revision', wallet_row.revision,
    'remaining', greatest(0, 2 - completed_count)
  );
end;
$$;

create or replace function public.credit_gameplay_reward(
  p_user_id uuid,
  p_event_id text,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  wallet_row public.wallets;
  earned_24h bigint;
begin
  if p_amount < 1 or p_amount > 300 then
    raise exception 'invalid_gameplay_reward' using errcode = '22023';
  end if;
  if p_reason !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'invalid_gameplay_reason' using errcode = '22023';
  end if;

  insert into public.wallets (user_id, balance)
  values (p_user_id, 150)
  on conflict (user_id) do nothing;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    p_user_id, 'welcome', 150, 'welcome:' || p_user_id::text,
    jsonb_build_object('version', 1)
  )
  on conflict (kind, external_id) do nothing;

  select * into wallet_row
  from public.wallets
  where user_id = p_user_id
  for update;

  if exists (
    select 1 from public.wallet_ledger
    where kind = 'gameplay' and external_id = p_user_id::text || ':' || p_event_id and user_id = p_user_id
  ) then
    select * into wallet_row from public.wallets where user_id = p_user_id;
    return jsonb_build_object(
      'credited', false,
      'balance', greatest(wallet_row.balance, 0),
      'revision', wallet_row.revision
    );
  end if;

  select coalesce(sum(amount), 0) into earned_24h
  from public.wallet_ledger
  where user_id = p_user_id
    and kind = 'gameplay'
    and created_at > now() - interval '24 hours';

  if earned_24h + p_amount > 500 then
    raise exception 'gameplay_reward_limit' using errcode = '22003';
  end if;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    p_user_id, 'gameplay', p_amount, p_user_id::text || ':' || p_event_id,
    jsonb_build_object('reason', p_reason)
  );

  update public.wallets
  set balance = balance + greatest(0, p_amount - reversal_debt),
      reversal_debt = greatest(0, reversal_debt - p_amount),
      revision = revision + 1,
      updated_at = now()
  where user_id = p_user_id
  returning * into wallet_row;

  return jsonb_build_object(
    'credited', true,
    'shells', p_amount,
    'balance', greatest(wallet_row.balance, 0),
    'reversalDebt', wallet_row.reversal_debt,
    'revision', wallet_row.revision
  );
end;
$$;

create or replace function public.reverse_verified_purchase(
  p_platform text,
  p_transaction_id text,
  p_reason text,
  p_store_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase_row public.purchase_transactions;
  wallet_row public.wallets;
  debit_amount bigint;
begin
  select * into purchase_row
  from public.purchase_transactions
  where platform = p_platform and transaction_id = p_transaction_id
  for update;

  if not found then
    return jsonb_build_object('reversed', false, 'reason', 'transaction_not_found');
  end if;
  if purchase_row.status <> 'verified' then
    return jsonb_build_object('reversed', false, 'reason', 'already_reversed');
  end if;

  select * into wallet_row
  from public.wallets
  where user_id = purchase_row.user_id
  for update;

  debit_amount := least(wallet_row.balance, purchase_row.shells);

  update public.purchase_transactions
  set status = case when p_reason = 'revoked' then 'revoked' else 'refunded' end,
      reversed_at = now(),
      store_payload = store_payload || coalesce(p_store_payload, '{}'::jsonb)
  where id = purchase_row.id;

  insert into public.wallet_ledger (user_id, kind, amount, external_id, metadata)
  values (
    purchase_row.user_id,
    'refund',
    -purchase_row.shells,
    'reversal:' || p_platform || ':' || p_transaction_id,
    jsonb_build_object('reason', p_reason, 'productId', purchase_row.product_id)
  )
  on conflict (kind, external_id) do nothing;

  update public.wallets
  set balance = greatest(0, balance - purchase_row.shells),
      reversal_debt = reversal_debt + greatest(0, purchase_row.shells - balance),
      revision = revision + 1,
      updated_at = now()
  where user_id = purchase_row.user_id
  returning * into wallet_row;

  return jsonb_build_object(
    'reversed', true,
    'balance', greatest(wallet_row.balance, 0),
    'reversalDebt', wallet_row.reversal_debt,
    'revision', wallet_row.revision
  );
end;
$$;

revoke all on function public.ensure_wallet() from public;
revoke all on function public.wallet_snapshot() from public;
revoke all on function public.spend_shells(text, uuid) from public;
revoke all on function public.create_ad_reward_ticket(text) from public;
revoke all on function public.credit_verified_purchase(uuid, text, text, text, jsonb) from public;
revoke all on function public.complete_ad_reward(uuid, uuid, jsonb) from public;
revoke all on function public.reverse_verified_purchase(text, text, text, jsonb) from public;
revoke all on function public.credit_gameplay_reward(uuid, text, integer, text) from public;

grant execute on function public.ensure_wallet() to authenticated;
grant execute on function public.wallet_snapshot() to authenticated;
grant execute on function public.spend_shells(text, uuid) to authenticated;
grant execute on function public.create_ad_reward_ticket(text) to authenticated;
grant execute on function public.credit_verified_purchase(uuid, text, text, text, jsonb) to service_role;
grant execute on function public.complete_ad_reward(uuid, uuid, jsonb) to service_role;
grant execute on function public.reverse_verified_purchase(text, text, text, jsonb) to service_role;
grant execute on function public.credit_gameplay_reward(uuid, text, integer, text) to service_role;
