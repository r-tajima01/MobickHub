# MobickHub プロジェクト運用フロー

> 要望 → 要件定義 → 設計 → 実装 → レビュー → 完了 を GitHub 上で回すための運用ルール。
> CLAUDE.md と一緒に読む。詳細な背景は [`project-context.md`](./project-context.md) 参照。

---

## 1. 全体像

```
[現場・副社長の発言]
        ↓ (sys02 が起票)
   📥 要望 Issue            … type:要望     / stage:1-受付
        ↓ (sys02 + Claude で相談)
   📐 要件定義 Issue        … type:要件定義 / stage:2-要件定義中
        ↓ (Claude が計画提示 → sys02 OK)
        ↓ stage:3-設計中
   🛠 実装 (PR)             … stage:4-実装中
        ↓
   👀 レビュー              … stage:5-レビュー中
        ↓ (マージ)
   ✅ 完了                  … stage:6-完了 → Issue Close
```

---

## 2. ステージごとの役割

| Stage | 主担当 | やること | 完了条件 |
|---|---|---|---|
| 1-受付 | sys02 | 要望Issue を起票。粒度は粗くてよい | 要件定義に進める価値があるか判断 |
| 2-要件定義中 | sys02 + Claude | 要件Issue を起票しスコープ・受け入れ基準を固める | sys02 が「これで実装に進んでいい」と判断 |
| 3-設計中 | Claude → sys02 | Claude が変更ファイル・関数単位の実装計画を提示。sys02 がOK | 計画OK・ブランチ作成 |
| 4-実装中 | Claude | feature/* ブランチで実装、随時 push | PR が draft → ready |
| 5-レビュー中 | sys02 | レビュー、ローカル動作確認 | LGTM |
| 6-完了 | sys02 | merge → Issue Close | main 反映、Issue が closed |

---

## 3. ラベル一覧

| カテゴリ | ラベル | 色の目安 |
|---|---|---|
| 種別 | `type:要望` | `#7057ff` (purple) |
|  | `type:要件定義` | `#5319e7` (deep purple) |
|  | `type:機能` | `#1d76db` (blue) |
|  | `type:バグ` | `#d73a4a` (red) |
|  | `type:改善` | `#0e8a16` (green) |
|  | `type:技術負債` | `#fbca04` (yellow) |
|  | `type:質問` | `#cccccc` (gray) |
| 進行段階 | `stage:1-受付` | `#ededed` |
|  | `stage:2-要件定義中` | `#bfd4f2` |
|  | `stage:3-設計中` | `#c5def5` |
|  | `stage:4-実装中` | `#1f6feb` |
|  | `stage:5-レビュー中` | `#fbca04` |
|  | `stage:6-完了` | `#0e8a16` |
| 優先度 | `priority:高` | `#b60205` |
|  | `priority:中` | `#fbca04` |
|  | `priority:低` | `#c2e0c6` |
| 領域 | `area:日次集計` | `#bfdadc` |
|  | `area:Excel取込` | `#bfdadc` |
|  | `area:認証` | `#bfdadc` |
|  | `area:マスタ` | `#bfdadc` |
|  | `area:インフラ` | `#bfdadc` |
|  | `area:UI` | `#bfdadc` |

---

## 4. マイルストーン

| 名前 | 期日 | 内容 |
|---|---|---|
| `Phase 1 - 日次集計WEB化` | 2026-05-31 | Excel配信を Web 化。副社長コミット済み |
| `Phase 2 - PartnerConnect` | 2026-08-初 | ディーラー向けタブレット携行ダッシュボード |
| `Phase 3 - 営業日報` | 2026-09〜 | 入力系・音声入力含む |
| `Phase 4 - AIロープレ/全般` | 2027〜 | AI ロープレ、MC 全般アプリ化 |

---

## 5. ブランチ命名

| 用途 | パターン |
|---|---|
| 機能追加 | `feature/<short-name>` |
| バグ修正 | `fix/<short-name>` |
| 雑務・設定 | `chore/<short-name>` |
| ドキュメント | `docs/<short-name>` |

`main` への直 push は禁止。必ず PR 経由。

---

## 6. GitHub Projects (ボード) — 手動セットアップ手順

Projects v2 は API 経由で自動作成できないため、初回のみ手動で作成する。

1. リポジトリ画面 → **Projects** タブ → **New project** → **Board** テンプレート
2. プロジェクト名: `MobickHub Roadmap`
3. デフォルトの "Status" 列を以下に変更:
   - `Backlog (要望)`
   - `Requirements (要件定義中)`
   - `Ready (実装待ち)`
   - `In Progress (実装中)`
   - `In Review (レビュー中)`
   - `Done (完了)`
4. カスタムフィールド追加 (お好みで):
   - `Phase` (Single select): Phase 1 / 2 / 3 / 4
   - `Priority` (Single select): 高 / 中 / 低
5. リポジトリの Issue・PR を自動でこのプロジェクトに追加するワークフローを有効化
   - Project の Settings → Workflows → "Auto-add to project"

---

## 7. 運用のコツ

- **要望が来たら即 Issue**。記憶に頼らず GitHub に投げる
- **要件定義 Issue は1機能=1Issue**。大きくなったら分割
- **Claude への依頼は要件 Issue にリンクして渡す**: 「#23 の要件で実装計画を出して」のように
- **PR は1要件=1PR が原則**。要件をまたぐ変更は分割
- **Phase をまたぐ大議論は Discussions** で行い、決まったら Issue に落とす

---

## 8. 関連ドキュメント

- [`../CLAUDE.md`](../CLAUDE.md) — Claude Code 用プロジェクト方針
- [`./project-context.md`](./project-context.md) — プロジェクト詳細背景
- [`./claude-code-tasks.md`](./claude-code-tasks.md) — Phase 1 の旧タスク集 (順次 Issue 化予定)
