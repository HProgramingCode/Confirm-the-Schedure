# 技術スタック（確定）

[requirements-and-tech.md](./requirements-and-tech.md) の §6 と [.cursor/rules/nextjs-stack.mdc](../.cursor/rules/nextjs-stack.mdc) に整合させた。**個人開発・MVP（手動グリッド優先）**向け。

---

## 1. 全体


| 層             | 選定                                 | 理由（要約）                                                                                                                                                    |
| ------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| フレームワーク       | **Next.js**（**App Router**）        | ルール既定。Route Handler / Server Actions で API と画面を一体管理しやすい。                                                                                                  |
| 言語            | **TypeScript**                     | 型でドメイン（版・月・A〜D・セル値）を共有しやすい。                                                                                                                               |
| DB（本番）        | **Turso**（libSQL）                  | ルール既定。SQLite 互換で小規模・個人向けに運用しやすい。                                                                                                                          |
| DB（ローカル）      | **SQLite**（ファイル or Turso ローカルレプリカ） | 本番と同じ SQL 方言に寄せる。                                                                                                                                         |
| ORM / DB アクセス | **Drizzle ORM** + `@libsql/client` | スキーマを TypeScript で管理し、マイグレーションを `drizzle-kit` で再現しやすい（方針は [.cursor/skills/backend-next/SKILL.md](../.cursor/skills/backend-next/SKILL.md) の lib 集約に合わせる）。 |
| 認証            | **Auth.js（next-auth v5）**          | ルール上の NextAuth 系。**Credentials**（メール＋パスワード）で MVP を成立させ、必要なら後から OAuth 追加。セッションは DB または JWT は実装時に選択（小規模なら JWT も可）。                                          |
| クライアント状態      | **Zustand**（必要な画面のみ）               | ルール既定。グリッド編集の一時状態など、必要最小限に留める。                                                                                                                            |
| UI            | **Tailwind CSS** + **shadcn/ui**（推奨） | **モバイルファースト**・**業務向け（全年齢で見やすく、装飾より可読性）**（[requirements §1.3](./requirements-and-tech.md)）。shadcn はデフォルトがややモダン寄りのため、**フォントサイズ・コントラスト・角丸・影を控えめ**にし、**不要なモーションを避ける**。Radix 由来のフォーカス・キーボード操作はそのまま活かす。**アクセシビリティ**は [.cursor/skills/design-ui/SKILL.md](../.cursor/skills/design-ui/SKILL.md) を参照。                                                                                                |
| バリデーション       | **Zod**                            | Server Action / Route Handler の入力検証に使う。                                                                                                                   |
| ホスティング        | **Vercel**（想定）                     | Next.js との相性。確定ではなく、他でも可。                                                                                                                                 |
| ビルド／開発起動     | **webpack モード**                    | 環境によって Turbopack が使えない場合があるため、`package.json` で `next build --webpack` / `next dev --webpack` を指定（[README](../README.md)）。 |

---

## 2. MVP でやらないこと（フェーズ2 へ）


| 項目        | 方針                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| 画像の自動取り込み | **未実装**。座標テンプレ＋切り出し＋ OCR（Tesseract.js または Cloud Vision）は [mvp-design.md](./mvp-design.md) の将来メモに委ね、実装時に本ファイルへ追記する。 |
| 班別フィルタ    | 要件どおり将来。                                                                                                           |


---

## 3. 環境変数（実装時に必須になるもの・例）

実装フェーズで `.env.example` を置く。例:

- `DATABASE_URL` — Turso または `file:./local.db`
- `AUTH_SECRET` — Auth.js 用
- `AUTH_URL` — 本番のオリジン（Vercel 等）

---

## 4. 管理者ロール（MVP）

- **簡易**: `User` に `isAdmin`（boolean）など **1 フラグ**で版・グリッドの CRUD を制限。
- 多段ロールは [requirements-and-tech.md §7.1](./requirements-and-tech.md) の未決のまま拡張可能。

---

## 5. 参照

- 要件: [requirements-and-tech.md](./requirements-and-tech.md)
- MVP 画面・DB 案: [mvp-design.md](./mvp-design.md)

