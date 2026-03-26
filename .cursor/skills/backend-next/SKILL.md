---
name: backend-next
description: >-
  Next.js の Route Handler、Server Actions、lib の DB（Turso/SQLite）、NextAuth、バリデーションと認可。
  ユーザーが API、バックエンド、サーバー、DB、認証、ルートハンドラ、Turso、SQLite、セッションと言ったときは
  必ずこのスキルを読んでから進める。
---

# バックエンド（Next）スキル

## レイヤー

- **HTTP 境界**（`route.ts`）: 入出力の検証、認証・認可、ステータスコード、ログに秘密を載せない。
- **ドメイン／DB**（`lib` 等）: クエリ、トランザクション、NextAuth 設定。ルートから直接生 SQL を長く書かず、既存の DB ヘルパーを使う。

## 安全

- ユーザー入力は**必ず検証**してからクエリや外部 API に渡す。
- エラーレスポンスは**外部に内部構造を見せない**（本番想定）。

## Route Handler と Server Actions

- `app/**/route.ts` がメインの API。`route.tsx` がある場合も同じ方針で扱う。
- Server Actions を使う場合は、**CSRF・認可**を既存のプロジェクト方針に合わせ、失敗時のユーザー向けメッセージを揃える。

## 終了時

- スキーマや環境変数を変えたら **README** と **`docs/stack.md`** または **`docs/dev-diary.md`** に追記する。
