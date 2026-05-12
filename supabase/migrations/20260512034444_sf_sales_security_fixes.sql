-- ビューを security_invoker に変更（呼出ユーザーの権限/RLSで評価する）
alter view public.sf_sales_v_partner_daily_summary set (security_invoker = on);
alter view public.sf_sales_v_rep_daily_summary     set (security_invoker = on);
alter view public.sf_sales_v_office_daily_summary  set (security_invoker = on);

-- 関数の search_path を固定（pgcrypto/uuid-ossp が動く前提で public, extensions）
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
