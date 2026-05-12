# supabase/

Supabase 関連の管理ファイル。

## migrations/

時系列順のDBマイグレーション (`<version>_<name>.sql` 形式)。Supabase CLI で適用。

```bash
# dev 環境に反映
supabase db push

# 本番に反映 (PC前で明示的に実行)
supabase db push --project-ref koffvevkbrjkavayqkez
```

スキーマ変更は**必ずこのディレクトリに新しいファイルを追加**。Supabase 管理画面で直接テーブル変更しないこと（マイグレーション履歴に残らないため）。

## ファイル命名規約

- `<UTC datetime: YYYYMMDDhhmmss>_<snake_case_name>.sql`
- 例: `20260512034339_sf_sales_initial_schema.sql`

## モジュール接頭辞

各モジュールはテーブル名のプレフィックスで区別:
- `sf_sales_*` — SalesField (Phase 1: 日次集計、Phase 2: PartnerConnect)
- `inv_*` — 在庫管理（将来）
- `crm_*` — 顧客管理（将来）

## 注意

- 新規テーブル作成時は必ず `enable row level security` を入れる
- ビューは `security_invoker = on` を設定して呼出ユーザーの RLS で評価させる
- `set search_path = public` を関数定義に入れる（セキュリティ警告対策）
