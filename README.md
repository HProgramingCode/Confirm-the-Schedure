# シフト確認（個人開発）

工場シフトを Web で確認する MVP。[docs/requirements-and-tech.md](docs/requirements-and-tech.md) を正とする。

## 必要環境

- Node.js 20 以上推奨
- npm

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local の AUTH_SECRET を長いランダム文字列に変更
npm run db:push
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## 環境変数（`.env.local`）

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | SQLite ファイル（例: `file:local.db`） |
| `AUTH_SECRET` | Auth.js 用シークレット（推測困難な文字列） |
| `AUTH_URL` | オリジン（開発時は `http://localhost:3000`） |

## よく使うコマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー（webpack） |
| `npm run build` / `npm start` | 本番ビルド・起動 |
| `npm run lint` | ESLint |
| `npm run db:push` | Drizzle スキーマを DB に反映 |
| `npm run db:studio` | Drizzle Studio（GUI） |
| `npm run db:seed` | サンプルデータ投入（`-- --force` で全消去後に再投入） |

## 初回ユーザー

**最初に登録したユーザーは自動的に管理者**（`isAdmin`）になります。版の作成と月次シフトの入力は管理画面から行います。

## サンプルデータ（開発用）

手元の DB にデモ用の版・ユーザー・**実行した年の3〜6月**のシフトを入れます（`/calendar` が「今年・今月」で参照するため、年は実行時に合わせます）。

```bash
# user テーブルが空のとき（初回）
npm run db:seed

# 既にユーザがいるときは全消去してから投入（注意）
npm run db:seed -- --force
```

- パスワードは全員 **`demo1234`**
- **管理者**: `a1@example.com`（佐藤 A一郎）のみ `isAdmin`
- **ユーザー**: A/B/C 列それぞれ 3 名（`a1@`〜`a3@`、`b1@`〜`b3@`、`c1@`〜`c3@` の `@example.com`）。詳細はシード実行後のコンソール出力を参照。
- 版名: `{実行年}年度（サンプル）`（例: 2026年に実行したら `2026年度（サンプル）`）
- シフト: **その年の 3・4・5・6月**の A〜D 全列（1/2/3/休 の繰り返しパターン）。今月が 3〜6 月なら `/calendar` にそのまま表示されます。それ以外の月は管理画面の月次で 3〜6 月を開いて確認してください。

スクリプト: [`scripts/seed.ts`](scripts/seed.ts)

## ビルドメモ

一部環境では `@next/swc-darwin-arm64` が読み込めず、Turbopack が使えない場合があります。そのため `dev` / `build` は **webpack** を指定しています。`node_modules` を再取得する際は `rm -rf node_modules && npm install` も試してください。

## ドキュメント

- [docs/stack.md](docs/stack.md) … 技術スタック
- [docs/mvp-design.md](docs/mvp-design.md) … 画面・DB 案
# Confirm-the-Schedure
