# MobickHub

> モビリティアンドコミュニケーション株式会社(MC)向け統合業務プラットフォーム
> ディーラー戦略支援を起点に、MC全社DXを段階的に実現する

---

## プロダクト位置づけ

MobickHub は MC の業務基盤として中核を担う統合プラットフォーム。営業支援を起点に、社内業務全般を取り込み、最終的にはレンタカー基幹システムの後継となることを視野に入れる。

スライド上のプロダクト名(Phase 2): **PartnerConnect FOR DEALERS** — MobickHub 内のディーラー向け機能名としての位置づけ。MobickHub が基盤、PartnerConnect が最初のフラッグシップ機能、という階層構造。

### 業務目的

1. 9期方針「訪問の質を上げる『話題の壁』への答え」を技術で実現する
2. データドリブンな営業組織への変革 (個人の経験 → 組織のデータ)
3. 4営業所 (大宮・川越・熊谷・越谷) の連携強化
4. ディーラー向けの提案品質向上 (過去実績 + 未来予定の可視化)

---

## 開発フェーズ

| Phase | 期間 | 内容 | 状態 |
|---|---|---|---|
| **1. 日次集計WEBアプリ化(置き換え)** | 2026年5月上旬〜5月末 | 既存「Excel + メール配信」を完全置き換え。`/daily` `/import` | 🚧 **実装中** |
| **2. ディーラーダッシュボード (PartnerConnect)** | 2026年6月〜8月初旬 | タブレット携行でディーラー訪問時に見せるダッシュボード。過去実績 + 未来予定 | ⏳ 未着手 |
| **3. 営業日報・入力系** | 2026年9月〜 | テキスト/音声日報、訪問記録 | ⏳ 未着手 |
| **4. AIロープレ・MC全般アプリ化** | 2027年〜 | Gemini Live API活用、営業以外の業務統合 | ⏳ 未着手 |
| **5. 基幹システム置き換え (将来構想)** | 2028年以降 | レンタカーシステム自体を MobickHub で代替 | ⏳ 未着手 |

詳細は [`docs/project-context.md`](docs/project-context.md) 参照。

---

## 技術スタック

| 領域 | 技術 |
|---|---|
| 言語 | TypeScript (strict mode) |
| フレームワーク | Next.js 15 (App Router) |
| UIライブラリ | React 19 |
| スタイリング | Tailwind CSS v3 (Phase 2 以降で shadcn/ui 追加検討) |
| グラフ | Recharts |
| バックエンド・DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| ホスティング | Vercel |
| コード管理 | GitHub |

Phase 2+ で追加予定: TanStack Table / TanStack Query / React Hook Form / Zod / shadcn/ui

---

## ドメイン

| 環境 | URL |
|---|---|
| Production | `mobickhub.mobilix-hd.com` |
| Preview | `*.mobickhub.vercel.app` (branchごと自動生成) |
| Local | `localhost:3000` |

---

## セットアップ (Quick Start)

### 前提

- Node.js 18+
- npm
- Supabase プロジェクト (dev/prod の2つ推奨)
- Vercel アカウント

### 手順

```bash
# 1. clone
git clone https://github.com/r-tajima01/MobickHub.git
cd MobickHub

# 2. 依存インストール
npm install

# 3. 環境変数設定
cp .env.example .env.local
# .env.local を編集して Supabase URL と Anon Key を入れる
#   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>

# 4. dev server 起動
npm run dev
# → http://localhost:3000

# 5. 型チェック / ビルド
npm run typecheck
npm run build
```

ログインユーザーは Supabase ダッシュボード → Authentication → Users で先に1人作る。

詳細は [`SETUP.md`](SETUP.md) 参照。

---

## ディレクトリ構成

```
MobickHub/
├── README.md                      ← このファイル
├── CLAUDE.md                      ← Claude Code 向けプロジェクト方針
├── SETUP.md                       ← セットアップ手順詳細
├── docs/
│   ├── project-context.md         ← プロジェクト全体方針 (MobickHub の WHY/WHAT/WHO/HOW)
│   ├── claude-code-tasks.md       ← 残タスク一覧
│   └── decisions/                 ← ADR (Architecture Decision Record) [将来追加]
├── mockup/                        ← 初期モック (HTMLプロトタイプ)
├── public/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           ← MC社員向け共通レイアウト
│   │   │   ├── daily/             ← Phase 1: 日次集計
│   │   │   ├── import/            ← Phase 1: Excel取込
│   │   │   ├── monthly/           ← (skeleton) 月次集計
│   │   │   ├── partners/          ← (skeleton) 取引先別
│   │   │   ├── reps/              ← (skeleton) 担当者別
│   │   │   ├── offices/           ← (skeleton) 営業所別
│   │   │   ├── targets/           ← (skeleton) 目標設定
│   │   │   └── settings/          ← (skeleton) 設定
│   │   ├── auth/signout/route.ts
│   │   ├── login/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                ← React コンポーネント
│   ├── lib/
│   │   ├── format.ts              ← 数値・日付フォーマッタ
│   │   └── supabase/              ← Supabase クライアント (client/server/middleware)
│   ├── types/database.types.ts    ← Supabase CLI 生成の型
│   └── middleware.ts              ← 認証ガード
├── supabase/migrations/           ← DB マイグレーション SQL
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## データモデル (Phase 1)

Supabase の `public` スキーマ、SalesField (Phase 1) は `sf_sales_*` プレフィックス:

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

将来モジュール: `inv_*` (在庫), `crm_*` (顧客管理) など

詳細は `src/types/database.types.ts` および `supabase/migrations/` 参照。

---

## 開発フロー

### ブランチ戦略
- `main` — 本番。直 push 禁止 (Branch Protection)、PR 必須
- `feature/<機能名>` — 機能開発 (1 Issue = 1 PR)
- `fix/<内容>` — バグ修正
- `chore/<内容>` — 雑務・設定変更

### PR
- PR テンプレートで「やったこと / 設計判断 / 学んだこと / 次回に活かせること」を記録
- Vercel Preview で動作確認後にマージ
- 重要 PR は1日寝かせて翌朝マージ判断

### マイグレーション
- スキーマ変更は必ず `supabase/migrations/` に SQL ファイルを追加
- Supabase 管理画面で直接テーブル変更しない (マイグレーション履歴に残らないため)
- 本番反映は明示的に PC前で `supabase db push --project-ref <prod>` で実行

### コミットメッセージ
- 日本語OK、形式: `[Phase1] 日次集計テーブルのスキーマ追加`

---

## セキュリティ

- API キーはコードに書かない。`process.env.<KEY>` で環境変数経由
- `.env.local` は絶対に GitHub に上げない (`.gitignore` で除外確認)
- 新しいテーブルを作ったら**必ず RLS (Row Level Security) を有効化**
- `NEXT_PUBLIC_` プレフィックスはブラウザに露出して良いものだけ

詳細は [`docs/project-context.md`](docs/project-context.md) § 9 参照。

---

## ステークホルダー

| 役割 | 関与 |
|---|---|
| 副社長 | 主依頼者、定期レビュー、Phase 毎の進捗報告 |
| 社長・経営層 | 全社的なコミット先、四半期程度の報告 |
| 営業所長 (4名) | β運用協力、Phase 2 のフィードバック源 |
| 配信担当者 | Phase 1 切替時の主協力者 |
| レンタカーシステム担当者 | Phase 2 着手前のヒアリング必須 |
| Kikuchi-buchou (菊地部長) | 管理部部長、決裁・社内調整窓口 |
| sys02 | プロジェクト主担当 (MOBILIX HOLDINGS 管理部) |

---

## ライセンス

社内プロジェクト
