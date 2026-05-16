# MobickHub Information Architecture (IA)

> 業務領域の棚卸し結果と、モジュール構成・URL構造・アクセス制御の全体設計を1ファイルにまとめたもの。
> 個別の判断根拠は `docs/decisions/ADR-NNN-*.md` を参照。
> 改訂時は **モジュール追加 / Phase 移動 / アクセス層変更** が起きたら必ず更新する。

---

## 1. このドキュメントの目的

- MobickHub が将来吸収する**業務領域 (モジュール)** を一覧化し、接頭辞・公開先・Phase配分を確定する
- 新規モジュール追加時に「どこに置くか・誰に見せるか・既存のどれと組み合わさるか」を即座に判断できる地図にする
- 9期方針説明会スライドで宣言した内容と、実装ロードマップの対応を可視化する

---

## 2. モジュール一覧

### 命名規則
- テーブル名・コード上の接頭辞は **3〜4文字の小文字**
- 1モジュール = 1接頭辞 = 1業務領域
- 他モジュールのテーブルを直接参照する場合は接頭辞で由来が分かる状態を保つ

### モジュール定義

| # | モジュール | 接頭辞 | 公開先 | 主たる内容 |
|---|---|---|---|---|
| ① | 営業ダッシュボード | `sf` | 内部 | 売上・受注・目標、日次/月次集計、ペース達成率 |
| ② | 営業日報・活動 | `act` | 内部 | 訪問記録、テキスト/音声日報、当日業務管理 |
| ③ | PartnerConnect | `dp` | **外部 (ディーラー)** | 取引先ディーラー向け実績/予定開示、タブレット商談 |
| ④ | リース・車両管理 | `flt` | 内部 | リース契約、解約、残存簿価、代替計画、整備予定 |
| ⑤ | 中古車オークション | `uc` | 内部 | USS出品計画、評価点、出品票、AAトラブル対応 |
| ⑥ | 車両品質チェック | `vq` | 内部 | 撥水/抗菌/洗車施工記録、検品チェックシート |
| ⑦ | 応対品質 | `cq` | 内部 | 電話/接客ロープレ記録、応対コンテスト |
| ⑧ | eレンタカー・損保 | `er` | 内部 (+損保連携) | 損保案件、回答秒数、成約率、損害課対応 |
| ⑨ | 経理分析 | `acc` | **経営者専用** | 勘定奉行データ、月次P/L、部門別損益、経営シミュレーション |
| ⑩ | 経営サマリ (BI) | `bi` | **経営者専用** | KGI 4指標集約、経理×営業×車両のクロス分析 |
| ⑪ | 教育・AIロープレ | `tr` | 内部 | Gemini Live ロープレ、教育コンテンツ |
| ⑫ | 共通基盤 | `core` | 内部 (横断) | 認証、ロール、組織マスタ、共通UIコンポーネント |

### 将来モジュール (Phase 4+ で検討)
- `hr` 人事・勤怠 (KOT連携)
- `crm` 顧客管理
- `inv` 在庫
- `mkt` マーケティング
- `ops` 単発Excel吸収用の受け皿 (経費・申請・棚卸・来客記録等)
- `rnt` レンタカー基幹 (Phase 5+ の遠景)

---

## 3. アクセス層マップ

MobickHub は3つのアクセス層に分かれる。URL接頭辞で物理的に分離する。

| 層 | URL接頭辞 | 想定ユーザー | 認証/制御 |
|---|---|---|---|
| **内部** | `/` `/daily` `/sales/*` `/fleet/*` `/used-cars/*` `/reports/*` `/quality/*` `/training/*` | MC社員 (営業所長・担当・配信・経理・管理) | Supabase Auth + ロールベースRLS |
| **経営機密** | `/exec/*` (`/exec/bi` `/exec/accounting/*` `/exec/strategy/*`) | 副社長・社長のみ | 上記 + `executive` ロール + アクセスログ |
| **外部 (取引先)** | `/portal/dealer/*` | 取引先ディーラー担当 | 別テナント認証 + 自社分のみ |

→ `/exec/*` は将来 M&A検討・グループ会社横串・役員人事系メニューが増えたときの受け皿。
→ `/portal/*` は将来 リース会社向け・顧客マイページ等が増えたら `/portal/lessor/*` `/portal/customer/*` を追加。

詳細: `docs/decisions/ADR-007-rbac-and-access-layers.md`

---

## 4. 9期方針説明会スライド ↔ モジュール対応表

9期方針 (本編 25スライド / 専門部会報告 18スライド) で宣言された施策と、MobickHub のモジュールの対応。

### 6つの柱 (本編 B-17〜B-24)

| 柱 | 該当モジュール | 主要KPI/指標 |
|---|---|---|
| ① 損保売上対策 | `er` `act` | eレンタカー成約率 60%、回答 45秒以内、月300件 |
| ② 新規開拓 | `sf` `act` `dp` | 年間獲得 200件 (トヨタ50/ホンダ30/日産10/マツダ5) |
| ③ 既存深耕 | `sf` `dp` `act` | 販売店年間売上件数 5,634件 |
| ④ 中古車収益 | `uc` `flt` | 評価点5 比率 70%、出品計画遵守 |
| ⑤ 車両品質 | `vq` | 月1回 撥水/抗菌施工、検品100% |
| ⑥ 応対品質 | `cq` `tr` | 業界No.1の信頼と安心、ロープレ・コンテスト実施 |

### 8期から見えた3つの壁 (B-15) ← MobickHub の存在意義
- 「訪問の質を上げる **話題の壁**」 → `dp` PartnerConnect が直接答える
- 「品質・スキル平準化の壁」 → `vq` `cq` `tr` が答える
- 「時間・リソースの制約」 → 全モジュールの自動化・AI化が答える

### DX推進部会の宣言 (専門部会 A-17)
- 「画面の二本柱」 = 過去実績 (売上・受注・件数) + 未来予定 (1年先の車検・点検・代替予定)
- 既存店は実績、**新規店はエリア平均で代用**
- 商談シナリオ: 「今期 車検145件・新車5台 → 代車利用85件 → 来期の新車上申」
  → `dp` PartnerConnect の中核仕様

### 経営指標 (B-7, B-8, B-18)
- KGI 4指標 (売上 / レンタカー粗利 / 中古車粗利 / 営業利益)
  → `bi` 経営サマリで集約
- 1期〜8期の売上・営業利益・レンタカー売上・中古車粗利の推移
  → `acc` 経理分析で動的再現

### オークション業務フロー (A-11, A-12)
- 出品先: USS東京 (仲介: アップルオートネットワーク)
- 売却担当: 三輪さん → 加藤副社長エスカレ
- SOP: 回送7日前までに車両入替、事故車両は出品前100%相談、出品票記載強化
  → `uc` モジュールが体系化

---

## 5. Phase × モジュール マトリクス

副社長への公式コミット (Phase 1〜4) を軸に、各モジュールの着手タイミングを定義する。

| Phase | 含むモジュール | 主要成果物 | 副社長への見せ方 |
|---|---|---|---|
| **1 (実装中)** | `sf` `core` | 日次集計WEBアプリ (Excel配信置き換え) | 営業 KPI が常時ブラウザで見える |
| **1B (Phase 1 と並走、5月末以降に披露)** | **`acc`** (Step 1: 勘定奉行データ単独) | 経理ベースの月次P/L・部門別損益 (`/exec/accounting/*`) | 経理ベースで経営状態が一画面で見える |
| **2** | `dp` `flt` `uc` `bi` (Step 2: 経理×営業×車両クロス) + `core` 拡張 (RBAC + 外部テナント) | PartnerConnect (タブレット商談) + 経営トップ画面完成 | KGI 4指標すべてリアルタイム可視化 |
| **3** | `act` `vq` `cq` `er` | 現場入力系一式 (営業日報・品質・応対・eレンタカー) | 現場品質 KPI が見える、Excelからの完全脱却 |
| **4** | `tr` + MC全般 (`hr` `crm` 等の選択着手) | AIロープレ本格運用、営業以外の業務取り込み開始 | AI活用による生産性向上 |
| **5+ (構想)** | `rnt` レンタカー基幹置き換え | - | - |

### Phase 1B の位置づけ
- 副社長公式コミット (Phase 1 = 2026/5末リリース) は `sf` のままで動かさない
- `acc` は **sys02 が裏で並走** し、5月末リリース後にお披露目するイメージ
- 段階的アプローチ:
  - **Step 1**: 勘定奉行データ単独で `acc` を立ち上げる (Phase 1B)
  - **Step 2**: Phase 2 で `flt`/`uc` のデータが揃ったタイミングで `bi` にクロス分析を実装

詳細: `docs/decisions/ADR-006-module-layout.md`

---

## 6. URL構造

```
/                                  ← トップ (内部ユーザーは /daily にリダイレクト、executive は /exec/bi へ)
/login

# 内部 (社内ユーザー向け)
/daily                             ← Phase 1 既存: 日次集計
/sales/*                           ← sf 営業詳細 (Phase 1 拡張)
/fleet/*                           ← flt リース・車両管理 (Phase 2)
/used-cars/*                       ← uc 中古車オークション (Phase 2)
/reports/*                         ← act 営業日報・活動 (Phase 3)
/quality/*                         ← vq 車両品質チェック (Phase 3)
/calls/*                           ← cq 応対品質 (Phase 3)
/e-rental/*                        ← er eレンタカー・損保 (Phase 3)
/training/*                        ← tr 教育・AIロープレ (Phase 4)
/import                            ← Phase 1 既存: Excel取込

# 経営機密 (executive ロールのみ)
/exec/bi                           ← bi 経営サマリ (KGI 4指標)
/exec/accounting/*                 ← acc 経理分析 (Phase 1B 先行 → Phase 2 拡張)
/exec/strategy/*                   ← 戦略指標 (将来)

# 外部 (取引先ディーラー)
/portal/dealer/                    ← dp PartnerConnect ログイン
/portal/dealer/dashboard           ← 過去実績 + 未来予定の二本柱画面
/portal/dealer/orders              ← 自社受注履歴
/portal/dealer/schedule            ← 1年先の車検・点検・代替予定
# (将来) /portal/lessor/*  /portal/customer/*

# システム共通
/settings                          ← 個人設定
/admin/*                           ← system_admin ロールのみ
```

---

## 7. テーブル名接頭辞ルール

| 接頭辞 | 例 |
|---|---|
| `sf_*` | `sf_sales_offices`, `sf_sales_daily_actuals` (Phase 1 既存) |
| `act_*` | `act_visit_logs`, `act_daily_reports` |
| `dp_*` | `dp_dealer_users`, `dp_dashboard_snapshots` |
| `flt_*` | `flt_vehicles`, `flt_lease_contracts`, `flt_terminations`, `flt_maintenance` |
| `uc_*` | `uc_auction_listings`, `uc_evaluation_scores`, `uc_used_car_sales` |
| `vq_*` | `vq_inspection_records`, `vq_treatment_logs` |
| `cq_*` | `cq_roleplay_sessions`, `cq_call_quality_scores` |
| `er_*` | `er_insurance_cases`, `er_response_metrics` |
| `acc_*` | `acc_chart_of_accounts`, `acc_departments`, `acc_trial_balance_monthly`, `acc_journal_entries`, `acc_budget`, `acc_import_jobs` |
| `bi_*` | `bi_kgi_snapshots`, `bi_cross_metrics` |
| `tr_*` | `tr_roleplay_logs`, `tr_training_contents` |
| `core_*` (or プレフィックスなし) | `core_users`, `core_roles`, `core_organizations` |

### ルール
1. 新規テーブルは必ずモジュール接頭辞をつける
2. 他モジュールへの外部キーは許容するが、**接頭辞で由来が分かる状態を保つ**
3. ビューは `sf_sales_v_*` のように接頭辞 + `v_` を挟む (Phase 1 慣習踏襲)
4. クロスモジュール集計のビューは `bi_v_*` に置く (Phase 2 以降)

---

## 8. ロール設計サマリ

詳細は `docs/decisions/ADR-007-rbac-and-access-layers.md`。

| ロール | 範囲 | 主なアクセス先 |
|---|---|---|
| `executive` | 経営者 (副社長・社長) | 全領域 + `/exec/*` |
| `office_manager` | 営業所長 (4名) | 自営業所 + 共通領域 (`/exec/*` 除く) |
| `sales_rep` | 営業担当 (18名) | 自分の活動 + 営業所内データ |
| `delivery_admin` | 配信担当 | Excel取込・配信業務、`sf` 全営業所閲覧 |
| `accounting` | 経理担当 | `acc` のうち経営機密外 (請求関連)、`/exec/*` 一部 |
| `system_admin` | sys02 / 管理部 | 全領域 + 設定 |
| `dealer` | 外部 (取引先) | `/portal/dealer/*` の自社分のみ (テナント分離) |

実装: Supabase Auth のユーザーに `role` カラム (or JWT カスタムクレーム) を持たせ、RLS で行レベルフィルタ。

---

## 9. 共通UIパターン

スライドから読み取れる業務特性:
- **報告系が多い** = 「フォーム入力 + 集計ダッシュボード」のペアが各モジュールで繰り返される
- **タブレット携行** = `dp` PartnerConnect は iPad 横向き想定、現場入力系は iPhone 想定もある
- **Excel置き換え** = 既存Excelの列構造に近いテーブル表示が求められる

### `core` に置くべき共通コンポーネント (Phase 2 で整備)

| コンポーネント | 役割 | 採用ライブラリ |
|---|---|---|
| `<DataForm>` | 汎用フォーム (Zod スキーマ駆動) | React Hook Form + Zod |
| `<DataTable>` | フィルタ・ソート・ヒートマップ対応テーブル | TanStack Table |
| `<KPICard>` | 数値カード (達成率・トレンド) | (Phase 1 で実装済み、抽象化) |
| `<TimeSeriesChart>` | 時系列チャート | Recharts |
| `<FileUpload>` | Excel/CSV/PDF アップロード + Edge Function 連携 | Phase 1 の `/import` パターン |
| `<RoleGate>` | ロールベース表示制御 | 自作 |

### Server / Client の責務分担
- データ取得: Server Component (CLAUDE.md 規約)
- 対話・フォーム: Client Component
- 集計ロジック: Supabase ビュー or RPC (SQL側に寄せる)

---

## 10. 未確定事項 (ヒアリング論点)

### A. 経理データ取り込み (`acc`, Phase 1B 着手前)
1. 勘定奉行のデータエクスポート権限は誰が持っている? (経理担当 / sys02 / 兼任)
2. CSV サンプルを1ヶ月分入手できるか → スキーマ確定の前提
3. 部門コード体系は `sf_sales_offices` (大宮/川越/熊谷/越谷) と一致しているか
4. 機密度の高い科目 (役員報酬・人件費明細) を `acc` に含めるか
5. 取込頻度: 月次 / 日次?
6. 過去データの取り込み範囲: 1期〜? 直近3年?

### B. レンタカーシステム連携 (`flt` `uc` `dp`, Phase 2 着手前)
7. データ抽出方式 (CSV / API / 帳票)
8. 抽出可能な項目: 車検・点検・新車・代替予定、リース契約、車両マスタ、整備履歴
9. 抽出頻度・自動化可否
10. レンタカーシステム担当者へのヒアリング日程確保

### C. 中古車オークション (`uc`, Phase 2 着手前)
11. 三輪さん (売却担当) へのヒアリング
12. USS出品票のフォーマット入手
13. アップルオートネットワークとの API/データ連携の可能性
14. 評価点・売却実績の既存Excel入手

### D. 外部テナント (`dp`, Phase 2 着手前)
15. ディーラー側ユーザー登録の運用 (誰が招待・誰が承認)
16. ディーラー側で見せる金額情報の粒度 (台数のみ / 金額あり / 粗利は隠す)
17. 認証方式 (メール+パスワード / SSO / 招待リンク)

---

## 11. 改訂履歴

| 日付 | 改訂内容 |
|---|---|
| 2026-05-16 | 初版作成。業務領域棚卸し v3 を確定。`acc` を Phase 1B 先行に配置。 |
