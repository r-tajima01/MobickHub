# Claude Code 用プロジェクト方針 (MobickHub)

> このファイルは Claude Code がプロジェクトを正しく理解するための要約。
> 詳細は [`docs/project-context.md`](docs/project-context.md) を参照。
> 運用フロー (要望→要件定義→実装) は [`docs/workflow.md`](docs/workflow.md) を参照。

---

## プロジェクトの位置づけ

**MobickHub** は モビリティアンドコミュニケーション (MC) 向け統合業務プラットフォーム。
副社長への公式コミット済み、後戻り不可。

**現在は Phase 1 (日次集計WEBアプリ化、2026年5月末リリース) を実装中。**

| Phase | 内容 | 期間 |
|---|---|---|
| 1 (現在) | 日次集計WEBアプリ化 (Excel配信置き換え) | 2026年5月末 |
| 2 | ディーラーダッシュボード PartnerConnect (タブレット携行) | 2026年8月初旬 |
| 3 | 営業日報・入力系 (音声含む) | 2026年9月〜 |
| 4 | AIロープレ・MC全般アプリ化 | 2027年〜 |

詳細は [`docs/project-context.md`](docs/project-context.md) § 3 参照。

---

## 技術スタック

- **Next.js 15** (App Router) + TypeScript (strict)
- **React 19**
- **Tailwind CSS v3** (Phase 2 で shadcn/ui 追加検討)
- **Supabase** (Postgres + Auth + Storage + Edge Functions)
  - Project ID: `koffvevkbrjkavayqkez`
  - Region: `ap-northeast-1` (Tokyo)
- **Vercel** デプロイ
- 主要ライブラリ: `@supabase/ssr`, `lucide-react`, `recharts`, `date-fns`

Phase 2+ で追加予定: TanStack Table / TanStack Query / React Hook Form / Zod / shadcn/ui

---

## データモデル (Phase 1)

```
sf_sales_offices         営業所 (4)
sf_sales_reps            担当者 (18)
sf_sales_partners        取引先カテゴリ (13)
sf_sales_stores          店舗 (554)
sf_sales_monthly_targets 月次目標 (取引先×営業所×担当者×月の4軸)
sf_sales_daily_actuals   日次実績 (店舗×業務日でユニーク、当月累計値)
sf_sales_import_jobs     Excel取込ジョブ
sf_sales_v_office_daily_summary    ビュー: 営業所別×日付の集計
sf_sales_v_partner_daily_summary   ビュー: 取引先別×日付の集計
sf_sales_v_rep_daily_summary       ビュー: 担当者別×日付の集計
```

詳細な型: `src/types/database.types.ts` (Supabase CLI で生成)

将来モジュール: `inv_*` (在庫), `crm_*` (顧客管理) 等を想定。テーブル名プレフィックスで分離。

---

## 実装済み (Phase 1)

- ✅ Supabase クライアント: `src/lib/supabase/{client,server,middleware}.ts`
- ✅ 認証 (メール+パスワード): `/login` + ミドルウェア保護
- ✅ サイドバー & トップバー: `src/components/{sidebar,topbar}.tsx`
- ✅ ダッシュボードレイアウト: `src/app/(dashboard)/layout.tsx`
- ✅ 日次集計ページ (`/daily`):
  - KPIカード4枚 (受注/売上、ペース達成率)
  - チャート2枚 (取引先別売上 / 担当者別ペース達成率)
  - 展開可能テーブル (取引先・担当者・店舗の3ビュー、ヒートマップ、月次目標+日進目標+月次%+日進%)
- ✅ Excel取込ページ (`/import`): Storage + Edge Function `sf-sales-parse-daily-xlsx`
- ✅ 達成率は**ペース調整**: 実績 / (月次目標 × 経過日数 / 月日数)

## 未実装

`docs/claude-code-tasks.md` 参照。主な残タスク:
- Phase 1 残: フィルタバー拡張、ヘッダー仕上げ、quick actions、目標設定UI、月次集計、マスタCRUD
- Phase 1 polish: loading.tsx, error.tsx, RLS 強化
- Phase 2 着手準備: shadcn/ui, TanStack Table 導入

---

## デザインガイドライン

`mockup/sales_app.html` (リポジトリ同梱) のExcelライクなトーンに合わせる:

- 背景 `#F7F6F2` (bg)
- テキスト `#1F1E1B` (ink)
- 罫線 `#ECEAE0` (line)
- アクセント `#378ADD` (accent)
- 良い `#0F6E56` (good) / 警告 `#854F0B` (warn) / 悪い `#993C1D` (bad)
- フォント: `system-ui` + 日本語フォント
- 数値は `tabular-nums`、フォーマッタは `src/lib/format.ts`

---

## 開発ルール

1. **データ取得は Server Component で。** Client Component は対話だけ
2. **テーブル名は必ず `sf_sales_` 等のモジュール接頭辞**。他モジュールと混ぜない
3. **スキーマ変更は必ず `supabase/migrations/` にSQL追加**。Supabase 管理画面で直接いじらない
4. **新規テーブル作成時は必ず RLS を有効化**
5. **環境変数**: クライアントから読むのは `NEXT_PUBLIC_*` のみ
6. **大きい機能は計画→レビュー→実装**: 「実装計画をファイル単位・関数単位で書き出して」と頼まれたら、コードを書く前に計画を提示
7. **コミットメッセージは日本語OK**、形式 `[Phase1] 日次集計テーブルのスキーマ追加`
8. **新規ブランチ命名**: `feature/<機能名>` / `fix/<内容>` / `chore/<内容>`、`main` への直 push 禁止

---

## AI への依頼スタイル

(詳細は [`docs/project-context.md`](docs/project-context.md) § 10 参照)

- **設計議論**: いきなり実装に入らず、方針を2〜3案出して比較。トレードオフを明示
- **コード実装**: 変更ファイル一覧と実装ステップを先に提示し、OK 後に着手
- **新概念導入**: 「今回新しく出てきた概念」を1〜2行で要約して伝える
- **判断の区別**: AI が判断していい部分と sys02 が判断すべき部分を区別
- **曖昧な依頼**: 実装に入らず聞き返す
- **ただし**: 軽い雑談や明確な質問にはサクッと返す。過剰な確認はしない
- **応答の長さ**: 重要な決定は十分に説明、雑な質問は短く

---

## 動作確認

```bash
# ローカル開発
npm run dev   # → http://localhost:3000

# 型チェック
npm run typecheck

# 本番ビルド
npm run build
```

本番: Vercel 自動デプロイ (GitHub `main` にpushすれば反映)

ログイン用ユーザーは Supabase ダッシュボード → Authentication → Users で先に作る。

---

## トラブルシューティング

- **TypeError: cookies() should be awaited** → `await cookies()` を使う (Next.js 15)
- **RLS で行が0件** → Supabase Auth → Users にユーザーがいて、ログイン状態か確認
- **Supabase の型推論で `never[]` になる** → `data ?? []` で受けて `as Foo[]` で型注釈。`.eq()` の引数に `string | null` を渡さない (必ず `string` を保証)
- **Edge Function タイムアウト** → `supabase functions logs sf-sales-parse-daily-xlsx`
- **xlsx 取込で 0行** → シート名が `【今期】当月実績`、列名 `取引先` `店舗` 等を確認
