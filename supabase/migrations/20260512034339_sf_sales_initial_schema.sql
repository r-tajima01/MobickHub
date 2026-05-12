-- 拡張機能（他モジュールでも使うため共通）
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- sf_sales_offices (営業所)
-- ----------------------------------------------------------------------------
create table public.sf_sales_offices (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  display_order int  default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
comment on table public.sf_sales_offices is '[SalesField] 営業所マスタ';

-- ----------------------------------------------------------------------------
-- sf_sales_reps (担当者)
-- ----------------------------------------------------------------------------
create table public.sf_sales_reps (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  office_id     uuid not null references public.sf_sales_offices(id) on delete restrict,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (name, office_id)
);
comment on table public.sf_sales_reps is '[SalesField] 営業担当者マスタ';
create index idx_sf_sales_reps_office on public.sf_sales_reps(office_id);

-- ----------------------------------------------------------------------------
-- sf_sales_partners (取引先)
-- ----------------------------------------------------------------------------
create table public.sf_sales_partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  category      text,
  display_order int  default 0,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
comment on table public.sf_sales_partners is '[SalesField] 取引先マスタ';

-- ----------------------------------------------------------------------------
-- sf_sales_stores (店舗)
-- ----------------------------------------------------------------------------
create table public.sf_sales_stores (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  partner_id          uuid not null references public.sf_sales_partners(id) on delete restrict,
  office_id           uuid not null references public.sf_sales_offices(id)  on delete restrict,
  sales_rep_id        uuid          references public.sf_sales_reps(id)     on delete set null,
  is_new_this_period  boolean default false,
  notes               text,
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (name, partner_id)
);
comment on table public.sf_sales_stores is '[SalesField] 店舗マスタ';
create index idx_sf_sales_stores_office  on public.sf_sales_stores(office_id);
create index idx_sf_sales_stores_rep     on public.sf_sales_stores(sales_rep_id);
create index idx_sf_sales_stores_partner on public.sf_sales_stores(partner_id);

-- ----------------------------------------------------------------------------
-- sf_sales_monthly_targets (月次目標)
-- ----------------------------------------------------------------------------
create table public.sf_sales_monthly_targets (
  id                    uuid primary key default gen_random_uuid(),
  year_month            date not null,
  partner_id            uuid not null references public.sf_sales_partners(id),
  office_id             uuid not null references public.sf_sales_offices(id),
  sales_rep_id          uuid not null references public.sf_sales_reps(id),
  order_count_target    int            default 0,
  sales_amount_target   numeric(12,0)  default 0,
  created_at            timestamptz    default now(),
  updated_at            timestamptz    default now(),
  unique (year_month, partner_id, office_id, sales_rep_id),
  check (year_month = date_trunc('month', year_month))
);
comment on table public.sf_sales_monthly_targets is '[SalesField] 月次目標';
create index idx_sf_sales_targets_month_office on public.sf_sales_monthly_targets(year_month, office_id);

-- ----------------------------------------------------------------------------
-- sf_sales_import_jobs (Excel取込ジョブ)
-- ----------------------------------------------------------------------------
create table public.sf_sales_import_jobs (
  id              uuid primary key default gen_random_uuid(),
  file_name       text not null,
  storage_path    text not null,
  file_size       bigint,
  business_date   date,
  status          text not null default 'pending',
  rows_imported   int  default 0,
  error_message   text,
  uploaded_by     uuid references auth.users(id),
  created_at      timestamptz default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  check (status in ('pending','processing','success','failed'))
);
comment on table public.sf_sales_import_jobs is '[SalesField] Excel取込ジョブ';
create index idx_sf_sales_jobs_status on public.sf_sales_import_jobs(status, created_at desc);
create index idx_sf_sales_jobs_date   on public.sf_sales_import_jobs(business_date);

-- ----------------------------------------------------------------------------
-- sf_sales_daily_actuals (日次実績)
-- ----------------------------------------------------------------------------
create table public.sf_sales_daily_actuals (
  id              uuid primary key default gen_random_uuid(),
  business_date   date not null,
  store_id        uuid not null references public.sf_sales_stores(id) on delete cascade,
  order_count     int            default 0,
  sales_count     int            default 0,
  sales_amount    numeric(12,0)  default 0,
  is_new_order    boolean        default false,
  imported_from   uuid           references public.sf_sales_import_jobs(id) on delete set null,
  created_at      timestamptz    default now(),
  updated_at      timestamptz    default now(),
  unique (business_date, store_id)
);
comment on table public.sf_sales_daily_actuals is '[SalesField] 日次実績';
create index idx_sf_sales_actuals_date       on public.sf_sales_daily_actuals(business_date);
create index idx_sf_sales_actuals_store_date on public.sf_sales_daily_actuals(store_id, business_date);

-- ----------------------------------------------------------------------------
-- 集計ビュー
-- ----------------------------------------------------------------------------
create or replace view public.sf_sales_v_partner_daily_summary as
select da.business_date, s.partner_id, s.office_id,
  count(distinct s.id)             as store_count,
  sum(da.order_count)              as order_count_actual,
  sum(da.sales_count)              as sales_count_actual,
  sum(da.sales_amount)             as sales_amount_actual
from public.sf_sales_daily_actuals da
join public.sf_sales_stores s on s.id = da.store_id
group by da.business_date, s.partner_id, s.office_id;

create or replace view public.sf_sales_v_rep_daily_summary as
select da.business_date, s.sales_rep_id, s.office_id,
  count(distinct s.id)             as store_count,
  sum(da.order_count)              as order_count_actual,
  sum(da.sales_count)              as sales_count_actual,
  sum(da.sales_amount)             as sales_amount_actual
from public.sf_sales_daily_actuals da
join public.sf_sales_stores s on s.id = da.store_id
where s.sales_rep_id is not null
group by da.business_date, s.sales_rep_id, s.office_id;

create or replace view public.sf_sales_v_office_daily_summary as
select da.business_date, s.office_id,
  count(distinct s.id)             as store_count,
  sum(da.order_count)              as order_count_actual,
  sum(da.sales_count)              as sales_count_actual,
  sum(da.sales_amount)             as sales_amount_actual
from public.sf_sales_daily_actuals da
join public.sf_sales_stores s on s.id = da.store_id
group by da.business_date, s.office_id;

-- ----------------------------------------------------------------------------
-- updated_at 自動更新トリガ（モジュール共通）
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'sf_sales_offices','sf_sales_reps','sf_sales_partners','sf_sales_stores',
    'sf_sales_monthly_targets','sf_sales_daily_actuals'
  ])
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.sf_sales_offices         enable row level security;
alter table public.sf_sales_reps            enable row level security;
alter table public.sf_sales_partners        enable row level security;
alter table public.sf_sales_stores          enable row level security;
alter table public.sf_sales_monthly_targets enable row level security;
alter table public.sf_sales_daily_actuals   enable row level security;
alter table public.sf_sales_import_jobs     enable row level security;

create policy "auth_read_sf_sales_offices"   on public.sf_sales_offices         for select to authenticated using (true);
create policy "auth_read_sf_sales_reps"      on public.sf_sales_reps            for select to authenticated using (true);
create policy "auth_read_sf_sales_partners"  on public.sf_sales_partners        for select to authenticated using (true);
create policy "auth_read_sf_sales_stores"    on public.sf_sales_stores          for select to authenticated using (true);
create policy "auth_read_sf_sales_targets"   on public.sf_sales_monthly_targets for select to authenticated using (true);
create policy "auth_read_sf_sales_actuals"   on public.sf_sales_daily_actuals   for select to authenticated using (true);
create policy "auth_read_sf_sales_jobs"      on public.sf_sales_import_jobs     for select to authenticated using (true);

create policy "auth_write_sf_sales_offices"  on public.sf_sales_offices         for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_reps"     on public.sf_sales_reps            for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_partners" on public.sf_sales_partners        for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_stores"   on public.sf_sales_stores          for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_targets"  on public.sf_sales_monthly_targets for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_actuals"  on public.sf_sales_daily_actuals   for all to authenticated using (true) with check (true);
create policy "auth_write_sf_sales_jobs"     on public.sf_sales_import_jobs     for all to authenticated using (true) with check (true);
