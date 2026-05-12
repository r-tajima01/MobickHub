# Claude Code タスク集 (SalesField)

実装済みフェーズ1〜3はスキップ。**フェーズ4から開始**してください。

各フェーズの「📋 プロンプト」セクションをClaude Codeに **そのまま貼り付け** て下さい。

## フェーズの全体像

| # | 内容 | 状態 |
|---|---|---|
| 1 | Supabaseクライアント+型生成 | ✅ 完了 |
| 2 | 認証 (メール+パスワード) | ✅ 完了 |
| 3 | サイドバー+トップバー+保護レイアウト | ✅ 完了 |
| 3.5 | 日次集計KPI+取引先別簡易テーブル | ✅ 完了 |
| 3.6 | Excel取込ページ | ✅ 完了 |
| **4** | **日次集計: グラフ2種** | ⏳ 着手前 |
| **5** | **日次集計: Excelライク展開可能テーブル** | ⏳ |
| 6 | 月次集計ページ | ⏳ |
| 7 | 目標設定画面 | ⏳ |
| 8 | マスタ管理 (取引先・担当者) | ⏳ |
| 9 | 営業所別アクセス制御 (RLS強化) | ⏳ |
| 10 | エラー境界, loading, polish | ⏳ |

---

## フェーズ4: 日次集計のグラフ実装

### 目的
モックHTMLにあった2つのチャートを実装。recharts使用。

### 📋 プロンプト

```
src/components/daily/ にチャートコンポーネントを2つ追加し、日次集計ページに組み込んでください。

要件:
1. src/components/daily/partner-chart.tsx (Client Component, recharts)
   - 取引先別 売上実績 (横棒、上位8件 + その他集約)
   - 系列: 実績バー (青 #378ADD) と 目標バー (薄灰 rgba(180,178,169,0.4))
   - 並び: 売上実績の降順
   - X軸: ¥1.2M 表記、Y軸: 取引先名
   - ツールチップ: ¥4,834,274 形式
   - データは props で受け取る

2. src/components/daily/rep-chart.tsx (Client Component, recharts)
   - 担当者別 達成率 (横棒)
   - 色分け: 80%以上=#1D9E75, 60-80%=#BA7517, 60%未満=#A32D2D
   - ツールチップ: 達成率 + 実績/目標の金額

3. src/components/daily/charts-row.tsx で2つを横並びに配置 (Tailwind grid grid-cols-2)
   - カードデザイン: bg-white border border-black/10 rounded-lg p-3.5
   - タイトル + 「詳細レポート →」リンク (今は空 href でOK)

4. src/app/(dashboard)/daily/page.tsx を更新:
   - 取引先別集計 (sf_sales_v_partner_daily_summary + sf_sales_monthly_targets) を取得
   - 担当者別集計 (sf_sales_v_rep_daily_summary + sf_sales_monthly_targets) を取得
   - 上記2つを ChartsRow に渡す
   - 現在のKPIカードとテーブルの間に配置

5. データなし時 (取引先0件など) は「データなし」表示する空状態UI

実装前に、まずファイル単位の計画を箇条書きで示してください。OKを出したら実装に入ってください。
完了したら npm run dev で起動して /daily にアクセス、チャートが表示されることをスクリーンショットで確認してください。
```

### ✅ 受け入れ条件
- /daily ページに2つのチャートが表示される
- 営業所フィルタを変えるとチャートも更新される
- データなしの取引先・担当者は除外して表示される

---

## フェーズ5: Excelライク展開可能テーブル

### 目的
モックHTMLにあった、取引先でグループ化された展開可能テーブルを実装。店舗別の達成率ヒートマップ表示まで。

### 📋 プロンプト

```
src/components/daily/excel-table.tsx を新規作成し、日次集計ページに組み込んでください。

要件:
1. 取引先でグループ化された展開可能テーブル (mockup/sales_app.html の table.excel と同じ見た目)
2. 列構成:
   #, 取引先/店舗, 担当者, 受注件数目標, 受注件数実績, 受注達成率, 売上目標, 売上実績, 売上達成率, 累計売上, 前期売上
3. グループ行 (取引先):
   - 背景 #F1EFE8
   - クリックで折りたたみ/展開、デフォルトは取引先売上 TOP3 のみ展開
   - 取引先名 + 店舗数 + 合計値
4. 詳細行 (店舗):
   - 担当者名にバッジ色を付ける (担当者ごとに5色: 宮内=青, 松江=緑, 伊藤=橙, 吉田=紫, 藤吉=ピンク)
   - 達成率セル: 80%以上=heat-good (薄緑bg, 緑文字), 60-80%=heat-warn (薄橙bg, 茶文字), 60%未満=heat-bad (薄赤bg, 赤文字), 0=灰色文字
5. 合計行: 黒背景, 白文字

データソース:
- stores一覧 (sf_sales_stores) を partners + sales_reps とJOIN
- 各店舗の daily_actuals (business_date=指定日) をLEFT JOIN
- 各店舗の monthly_targets (year_month=指定月) を集計対象月でLEFT JOIN

実装前に、データ取得クエリの方針 (SQL or supabase-js組合せ) と、Client/Serverの責任分割を提示してください。
レビューしてからGOを出します。
```

### ✅ 受け入れ条件
- 取引先13グループでテーブルが描画される
- グループ展開で店舗が表示される
- 担当者バッジが色分けされている
- 達成率セルがヒートマップ表示

---

## フェーズ6: 月次集計ページ

### 📋 プロンプト

```
src/app/(dashboard)/monthly/page.tsx を実装してください。

要件:
1. URLクエリ: ?month=2026-04&office=<office_id>
2. データ:
   - 当月最終実績 = max(business_date) where date_trunc('month',business_date) = 指定月
   - その日のdaily_actualsを使ってKPI/テーブル/チャート
3. 追加要素:
   - 日次推移グラフ (折れ線): 当月1日〜末日の sales_amount_actual を sf_sales_v_office_daily_summary から取得して折れ線で表示
   - 直近12ヶ月の月次売上推移 (縦棒)
4. レイアウトは /daily のコンポーネントを再利用 (共通部品は src/components/shared/ にリファクタしてOK)

実装前に計画を提示。完了したら /monthly?month=2026-04 で動作確認。
```

---

## フェーズ7: 目標設定画面

### 📋 プロンプト

```
src/app/(dashboard)/targets/page.tsx を実装してください。

要件:
1. URLクエリ: ?month=2026-04&office=<office_id> (営業所必須)
2. テーブル形式: 行 = 取引先 × 担当者の組合せ (営業所所属の担当者のみ)
3. 列: 受注目標 (number input), 売上目標 (number input + 円表示), 前年同月実績 (参考)
4. インライン編集 (onBlurで保存): sf_sales_monthly_targets テーブルへ UPSERT
5. 「先月の目標をコピー」ボタン: 当月空セルだけ前月値で埋める
6. 「今期累計目標」ヘッダー表示

実装前に、データ取得クエリ (取引先・担当者の組合せをどう生成するか) を提案してください。
```

---

## フェーズ8: マスタ管理

### 📋 プロンプト

```
src/app/(dashboard)/partners/page.tsx?view=master と src/app/(dashboard)/reps/page.tsx?view=master でマスタ管理画面を実装してください。

要件 (取引先):
- 一覧: name, category, display_order, is_active, 店舗数, アクション
- 新規追加 / 編集 (モーダル or インライン) / 論理削除
- 並び替え (display_order)

要件 (担当者):
- 一覧: name, 営業所 (select), is_active, 担当店舗数
- 新規追加 / 編集 / 論理削除

両方ともクエリで ?view=master が無いときは「営業所別/担当者別レポート」が出る (フェーズ6でやる)。
```

---

## フェーズ9: 営業所別アクセス制御 (RLS強化)

### 📋 プロンプト

```
営業所別の閲覧制御をRLSで実装してください。

設計:
1. user_office_access テーブルを新規作成 (user_id, office_id, role)
2. 既存の auth_read_sf_sales_* ポリシーを置き換え:
   - daily_actuals/stores/monthly_targets は user の office_id に該当するレコードのみ閲覧可能
   - offices, partners, sales_reps はマスタなので全件閲覧可能
3. UI側: 表示できる営業所のみが営業所フィルタに出るようにする

Supabase MCP を使って migration を当てる手順を計画書として提示してください。実行は私が承認します。
```

---

## フェーズ10: Polish & デプロイ

### 📋 プロンプト

```
本番リリースに向けた仕上げ:

1. src/app/(dashboard)/error.tsx と loading.tsx を追加
2. src/app/error.tsx と src/app/not-found.tsx を追加
3. npm run lint と npx tsc --noEmit でエラーゼロを確認
4. README.md を更新 (使い方、運用ルール、トラブル対応)
5. Vercel本番URLにアクセスして全主要ページの動作確認

最終チェックリスト形式で報告してください。
```

---

## ヒント

- フェーズが大きすぎる時は「これを2〜3個のサブタスクに分解して」と頼む
- DBスキーマ変更は Supabase MCP の `apply_migration` を使う
- 型を再生成したい時: Supabase CLI の `supabase gen types typescript --project-id koffvevkbrjkavayqkez --schema public > src/types/database.types.ts`
- 詰まったら `git diff` で確認、ダメなら `git reset --hard HEAD` で巻き戻し
