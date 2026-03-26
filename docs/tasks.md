# タスク

## 進行中

- （なし）

## 次にやる

- **shadcn/ui** の `init` と Button / Input 等への置き換え（現状はプレーン Tailwind）
- 月の切替 UI（`/calendar?year=&month=` 等）
- Turso 本番用 `DATABASE_URL` と Vercel デプロイ確認
- `node_modules` の SWC バイナリ破損時は `rm -rf node_modules && npm install` を試す

## 直近の完了

- [x] 2026-03-26 — 会話からジュニア向けナレッジを自動判断して `docs/notes/` または日記へ反映する Cursor ルール（`junior-knowledge-from-sessions.mdc`）と `docs/templates/junior-note.md` を追加。
- [x] 2026-03-26 — `docs/architecture/` にアーキテクチャ設計書を作成。フォルダ構成・フロントエンド（frontend-nextjs.mdc 反映）・バックエンド・データフロー・シーケンス図を整備。
- [x] 2025-03-26 — [`scripts/seed.ts`](../scripts/seed.ts) と `npm run db:seed`（`--force` で全消去→再投入）。当月の A〜D セル・デモユーザー2件（`demo1234`）。README に手順記載。
- [x] 2025-03-26 — Next.js 16 スキャフォールドをルートへマージ、Drizzle・Auth.js（Credentials・JWT）・主要ルート（登録／ログイン／カレンダー／A〜D 切替／管理・月次グリッド）を実装。`npm run build`（webpack）・`lint` 通過。
- [x] 2025-03-26 — 業務系トーン（装飾より可読性・全年齢）と shadcn 推奨を docs に反映
- [x] 2025-03-26 — モバイルファースト・汎用 UI/UX（紙再現不要）を要件・mvp-design・stack に反映
- [x] 2025-03-26 — [stack.md](./stack.md) で技術選定、[mvp-design.md](./mvp-design.md) で画面・DB 案

## バックログ（参考）

- 班別・グループ別の絞り込み（追加開発）
- フェーズ2: 画像座標＋OCR 取り込み
