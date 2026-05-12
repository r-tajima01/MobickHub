-- 営業所
insert into public.sf_sales_offices (name, display_order) values
  ('越谷', 1),
  ('川越', 2),
  ('熊谷', 3),
  ('大宮', 4)
on conflict (name) do nothing;

-- 担当者
insert into public.sf_sales_reps (name, office_id) values
  ('宮内',     (select id from public.sf_sales_offices where name = '越谷')),
  ('松江',     (select id from public.sf_sales_offices where name = '越谷')),
  ('吉田',     (select id from public.sf_sales_offices where name = '越谷')),
  ('伊藤',     (select id from public.sf_sales_offices where name = '越谷')),
  ('藤吉',     (select id from public.sf_sales_offices where name = '越谷')),
  ('三輪',     (select id from public.sf_sales_offices where name = '川越')),
  ('藤井',     (select id from public.sf_sales_offices where name = '川越')),
  ('松澤',     (select id from public.sf_sales_offices where name = '川越')),
  ('石塚',     (select id from public.sf_sales_offices where name = '川越')),
  ('久連山',   (select id from public.sf_sales_offices where name = '川越')),
  ('小板橋',   (select id from public.sf_sales_offices where name = '熊谷')),
  ('小林',     (select id from public.sf_sales_offices where name = '熊谷')),
  ('森',       (select id from public.sf_sales_offices where name = '熊谷')),
  ('五十嵐',   (select id from public.sf_sales_offices where name = '大宮')),
  ('山﨑',     (select id from public.sf_sales_offices where name = '大宮')),
  ('松井',     (select id from public.sf_sales_offices where name = '大宮')),
  ('関口',     (select id from public.sf_sales_offices where name = '大宮')),
  ('髙橋',     (select id from public.sf_sales_offices where name = '大宮'))
on conflict (name, office_id) do nothing;

-- 取引先
insert into public.sf_sales_partners (name, category, display_order) values
  ('埼玉スバル',         'メーカー直販', 1),
  ('日産プリンス',       'メーカー直販', 2),
  ('カローラ新埼玉',     'メーカー直販', 3),
  ('修理工場・代理店',   '代理店',       4),
  ('埼玉ダイハツ',       'メーカー直販', 5),
  ('スズキ自販関東',     'メーカー直販', 6),
  ('スズキ自販埼玉',     'メーカー直販', 7),
  ('三菱',               'メーカー直販', 8),
  ('埼玉日産',           'メーカー直販', 9),
  ('関東マツダ',         'メーカー直販', 10),
  ('その他トヨタ',       'その他',       11),
  ('その他ホンダ',       'その他',       12),
  ('その他販売店',       'その他',       13)
on conflict (name) do nothing;
