# ADR-008: 勘定奉行データ取り込みと経理分析 (`acc`) の段階設計

## 決定日
2026-05-16

## ステータス
Proposed — 経理側ヒアリング完了後に Accepted に変更

## 文脈 (背景・課題)

ADR-006 で `acc` (経理分析) を Phase 1B として Phase 1 と並走で先行することを決定した。
sys02 の方針は明確に「**勘定奉行から取れるデータの活用を最初にやって、そのあと営業系のExcelなどの数字を組み合わせていきたい**」。

これは2段階のアプローチを意味する:

1. **Step 1**: 勘定奉行データ単独で経理分析画面を立ち上げる (Phase 1B)
2. **Step 2**: Phase 2 で MobickHub 内の業務データ (`sf`/`flt`/`uc`/`act`) と組み合わせ、クロス分析を `bi` で実現

このADRは Step 1 のスキーマ・取り込みフロー・アクセス制御を定義する。Step 2 のクロス分析設計は Phase 2 着手時の別ADRとする。

### 関連する既存資産
- 勘定奉行 (OBC基幹会計システム) — 振替CSV取り込み先として MC で稼働中 (`docs/project-context.md` L437)
- BillOne — 請求書管理 (同 L437)
- KOT — 勤怠管理 (同 L438)

### 9期スライドとの接続
- KGI 4指標 (売上 / レンタカー粗利 / 中古車粗利 / 営業利益) は経理側で確定済み (本編 B-7, B-18)
- 1期〜8期の推移グラフ (B-8, B-9) は経理データを動的に再現できる
- 売上構成比 (損保4社 44% / 販売店 37% / HC埼玉中 18% / 個人 1%) もセグメント別仕訳から導出可能 (B-10)

## 検討した選択肢

### 案A: 仕訳明細レベルで全件取り込み
- 勘定奉行から仕訳CSVをエクスポートし、明細行単位で DB保存
- **メリット**: 任意の粒度で集計可能、ドリルダウン対応
- **デメリット**:
  - データ量が大きい (年間数十万行)
  - 個人情報・機密度の高い明細も含まれる
  - 取込時間・整合性チェックの負担

### 案B: 月次試算表 (科目×部門×月) のみ取り込み
- 月次締め後の試算表だけを取り込む
- **メリット**: データ量小、取込シンプル、機密度コントロールしやすい
- **デメリット**:
  - 任意期間の集計ができない (月境界に縛られる)
  - 仕訳の中身が見えないため、想定外の指標を追加するときに勘定奉行に戻る必要

### 案C (採用): Step 1 は月次試算表、Step 2 で必要に応じて仕訳明細追加
- Phase 1B では月次試算表で立ち上げ、まず経営者が「経理データを Web で見る」体験を作る
- Step 2 (Phase 2) で「もっと細かく見たい」要望が出たら、仕訳明細取り込みを追加する判断
- **メリット**:
  - 最小コストで経営価値を出せる
  - 機密度の高い明細を最初から扱わなくて済む
  - sys02 の負荷を Phase 1 と並走できる範囲に収める
- **デメリット**:
  - 後で仕訳明細を追加するときにスキーマ拡張が必要 (許容範囲)

## 決定

**案C を採用。Step 1 は月次試算表ベースで構築する。**

### Step 1 スキーマ案

```
acc_chart_of_accounts          勘定科目マスタ
  - code            text PK     例: "5111" (売上高)
  - name            text        例: "レンタカー売上"
  - category        text        例: "売上" / "売上原価" / "販管費" / "営業外"
  - parent_code     text FK     階層構造 (任意)
  - is_confidential boolean     役員報酬など機密度の高い科目フラグ

acc_departments                部門マスタ (営業所と紐づけ)
  - code            text PK     勘定奉行の部門コード
  - name            text        例: "大宮営業所"
  - sales_office_id uuid FK     sf_sales_offices.id とマッピング (任意)

acc_segments                   セグメントマスタ (顧客チャネル別)
  - code            text PK     例: "INS_SJ" (損保ジャパン), "DEAL" (販売店)
  - name            text

acc_trial_balance_monthly      月次試算表 (科目×部門×セグメント×月)
  - id              uuid PK
  - fiscal_year     int         例: 9 (9期)
  - fiscal_month    int         1〜12
  - account_code    text FK     acc_chart_of_accounts.code
  - department_code text FK     acc_departments.code
  - segment_code    text FK     acc_segments.code (NULL可、未分類用)
  - amount          numeric
  - imported_at     timestamptz
  UNIQUE (fiscal_year, fiscal_month, account_code, department_code, segment_code)

acc_budget                     予算 (任意、Phase 1B 後半 or Phase 2)
  - fiscal_year, fiscal_month, account_code, department_code, segment_code, amount

acc_import_jobs                取込ジョブ (sf_sales_import_jobs と同パターン)
  - id, file_path, status, error_message, row_count, imported_by, created_at
```

### 取り込みフロー

```
[経理担当] 勘定奉行 → 月次試算表CSVエクスポート
     ↓
[sys02 or 経理担当] /exec/accounting/import 画面で CSV アップロード
     ↓
[Supabase Storage] バケット acc-imports/{year}/{month}/ に保存
     ↓
[Edge Function] acc-parse-monthly-trial-balance
     - CSV パース (SheetJS or papaparse)
     - acc_chart_of_accounts / acc_departments / acc_segments と突合
     - 未登録の科目・部門・セグメントを検出し、import_jobs.error_message に格納
     - acc_trial_balance_monthly に UPSERT (ユニーク制約で重複防止)
     ↓
[/exec/accounting] 画面で即時反映
```

### 画面構成 (Phase 1B)

```
/exec/accounting/
  ├ /import           ← CSV アップロード (delivery_admin + executive + system_admin)
  ├ /monthly          ← 月次P/L (全社・部門別・セグメント別の切替)
  ├ /accounts         ← 勘定科目別推移 (1期〜現在)
  ├ /departments      ← 部門別損益マトリクス
  ├ /trends           ← 売上・営業利益の長期推移 (B-8, B-9 のグラフ再現)
  └ /masters          ← マスタメンテ (科目・部門・セグメント編集)
```

### アクセス制御 (ADR-007 と整合)

| パス | 閲覧可能ロール |
|---|---|
| `/exec/accounting/*` | `executive`, `system_admin` |
| `/exec/accounting/import` | 上記 + `delivery_admin` (取込のみ) + `accounting` (取込のみ) |
| `acc_chart_of_accounts.is_confidential = true` の科目 | `executive` のみ閲覧、他ロールは RLS で除外 |

## 理由

1. **最小スコープで経営価値を最大化**: 月次試算表だけで KGI推移・部門別損益・セグメント別売上がすべて見える。これは副社長が現在 Excel + 勘定奉行GUI でやっている作業の置き換えとして十分。
2. **Phase 1 既存実装の再利用**: Excel 取込パターン (`sf-sales-parse-daily-xlsx`) を `acc-parse-monthly-trial-balance` に流用できる。新規学習コスト最小。
3. **段階拡張の余地**: Step 2 (Phase 2) で仕訳明細を追加するとき、`acc_journal_entries` テーブルを追加して既存テーブルとリレーションを張れば既存画面は壊れない。
4. **9期スライド再現性**: B-7 / B-8 / B-18 のグラフが動的になり、副社長が任意月で「今この瞬間の経営状態」を見られる。
5. **クロス分析への準備**: 部門コード ↔ `sf_sales_offices` マッピングと、セグメントコード ↔ 取引先カテゴリのマッピングを Phase 1B で整備しておくと、Phase 2 で `bi` がクロス分析する時の前提が揃う。

## 影響

### ポジティブ
- Phase 1B 終了時点で経営者が「経理データを Web で見る」体験が確立する
- Phase 2 で `bi` がクロス分析を実装する基盤データが揃う
- 勘定奉行GUI の代替として、副社長が任意のデバイスから経営状態を確認できる
- 1期〜8期の推移グラフが動的に表示されるため、9期方針説明会スライドの数字が陳腐化しない

### ネガティブ / 受容するリスク
- 月次粒度のため、月途中の細かいトレンドは追えない (Step 2 で仕訳明細を追加して解消可)
- 勘定奉行データのエクスポート権限と運用が未確定 → ヒアリング必須 (下記)
- 部門コード ↔ 営業所のマッピングがずれている可能性 → マッピングテーブルで吸収

## 経理側ヒアリング論点 (Phase 1B 着手前の必須項目)

1. **エクスポート権限**: 勘定奉行から月次試算表 CSV を出せるのは誰か (経理担当 / sys02 / 兼任)
2. **CSV サンプル入手**: 1ヶ月分のサンプルデータ → スキーマ確定の前提
3. **部門コード体系**: `sf_sales_offices` (大宮/川越/熊谷/越谷) と一致しているか、マッピング要か
4. **セグメント管理の実態**: 損保4社・販売店・HC埼玉中・個人 の区分が勘定奉行側でどう管理されているか (補助科目? セグメント機能? 部門?)
5. **機密度の高い科目**: 役員報酬・人件費明細を `acc` に含めるか、含めるなら `is_confidential` フラグで `executive` 限定にするか
6. **取込頻度**: 月次締め後の手動アップロード (推奨) or 自動連携 (将来検討)
7. **過去データ範囲**: 1期〜遡及取り込み or 直近3年 or 9期のみ
8. **予算データの存在**: 月次試算表に予算列があるか、別ファイルか、予算管理は Phase 2 以降に回すか

→ これらのヒアリング結果に基づき、本ADRを Accepted に更新する。

## 関連

- `docs/information-architecture.md` § 2 (`acc` モジュール), § 5 (Phase 1B), § 10 (ヒアリング論点)
- `docs/decisions/ADR-006-module-layout.md`
- `docs/decisions/ADR-007-rbac-and-access-layers.md`
- `docs/project-context.md` § 13 (既存資産・関連する既存システム)
