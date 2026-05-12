# 🚀 セットアップ手順

このプロジェクトを受け取ってから、ローカルで動かし、GitHub→Vercelに乗せるまでの完全手順。所要時間 **30〜60分**。

## 前提

以下がPCに入っていることを確認:

```bash
node -v       # v20.x 以上
npm -v        # 10.x 以上
git --version # 2.x 以上
claude --version  # Claude Code (なければ: npm install -g @anthropic-ai/claude-code)
```

## 1. ローカル起動 (5分)

```bash
# このzipを解凍した salesfield フォルダで:
cd salesfield
npm install            # 1〜2分かかる
npm run dev
```

http://localhost:3000 にブラウザでアクセス。`/login` に飛ばされる。

### 1-1. ログイン用ユーザーを作る

Supabaseダッシュボード (https://supabase.com/dashboard/project/koffvevkbrjkavayqkez) を開く:

1. 左メニュー **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email: 自分のメール
4. Password: 強いパスワード
5. **Auto Confirm User**: ON
6. **Create user**

ローカルの `/login` 画面でこれを使ってログイン。`/daily` に遷移して、KPIカードと取引先別集計表が見えれば成功。

### 1-2. Excel取込を試す

サイドバー **取込** → **Excel取込** で `日次実績_20260417.xlsx` (元のファイル名のまま日本語でもOK、システム側でリネームします) をドロップ → アップロード。

「✅ 取込完了: 551行 / 新規店舗 0店舗 (2026-04-17)」が出れば成功（既にデータが入っているので新規店舗は0）。

## 2. GitHubに上げる (10分)

### 2-1. GitHubリポジトリ作成

GitHub右上 **+** → **New repository**:
- Repository name: `salesfield` (任意)
- **Private** にチェック
- README/.gitignore/license はチェックしない
- **Create repository**

### 2-2. ローカルから push

```bash
cd salesfield  # まだいるはず

git init
git add .
git commit -m "feat: initial scaffold with Supabase + SalesField module"
git branch -M main
git remote add origin https://github.com/<あなたのGitHubユーザー名>/salesfield.git
git push -u origin main
```

> 初回 push 時に GitHub の認証が必要。HTTPS で push する場合は **Personal Access Token** を求められる。
> Tokenは GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (repo スコープにチェック) で作成。

## 3. Vercelに接続 (10分)

### 3-1. Import Project

1. https://vercel.com にログイン (GitHubアカウント)
2. **Add New** → **Project**
3. GitHub から `salesfield` を選択 → **Import**
4. Framework Preset: Next.js (自動検出)

### 3-2. 環境変数を設定

**Environment Variables** 欄で:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://koffvevkbrjkavayqkez.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (`.env.local` からコピー) |

3つともすべての環境 (Production/Preview/Development) にチェック。

### 3-3. Deploy

**Deploy** ボタン → 2〜3分待つ → 完了。

`https://salesfield-xxx.vercel.app` のような URL ができる。Supabaseユーザーでログインできれば本番デプロイ成功。

## 4. Claude Code でフェーズ4以降を実装 (30分〜)

### 4-1. Claude Code 起動

```bash
cd salesfield   # プロジェクトルート
claude
```

### 4-2. 最初に CLAUDE.md を読ませる

Claude Code は自動で `CLAUDE.md` を読みますが、念のため最初のメッセージで:

```
このプロジェクトの CLAUDE.md と docs/claude-code-tasks.md を読んで、現状の理解と次にやることを説明してください。
```

Claude Codeが状況を理解したら、フェーズ4 (グラフ実装) のプロンプトを `docs/claude-code-tasks.md` からコピペして貼り付け。

### 4-3. 開発フロー

```
[フェーズプロンプトを貼る]
   ↓
[Claude Code が実装計画を提示]
   ↓
[レビューしてOKと答える]
   ↓
[Claude Code が実装]
   ↓
[ブラウザで動作確認]
   ↓
[git add . && git commit -m "feat: phase X" && git push]
   ↓
[Vercelで自動デプロイ → 本番URLで再確認]
```

## トラブルシューティング

### npm install で失敗
- Node.jsバージョンが古い可能性。`node -v` で20以上か確認

### `npm run dev` 起動時に Supabase 接続エラー
- `.env.local` がプロジェクトルートにあるか確認
- 値が `.env.example` と同じキー名か確認

### `/login` でログインしてもループする
- Supabase で対象ユーザーが Auto Confirm されているか確認 (Authentication → Users → 該当ユーザー → Confirmed at に日時が入っているか)

### Vercel で `Application error: a client-side exception`
- Vercel の環境変数を確認 (`NEXT_PUBLIC_*` が3つ入っているか)
- Redeploy で再ビルド

### Claude Code が変な方向に進む
- `Esc` で割り込んで、「もう一度状況を整理して、何が問題で何をすべきか箇条書きで言って」と頼む
- それでもダメなら `git reset --hard HEAD` で巻き戻し

詳細は `CLAUDE.md` の末尾参照。
