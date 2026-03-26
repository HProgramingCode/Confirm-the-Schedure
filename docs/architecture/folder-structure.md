# フォルダ構成

## 全体構造

```
Confirm-the-Schedure-app/
├── .cursor/                    # Cursor IDE 設定・ルール
│   ├── rules/                  # 開発ルール（.mdc）
│   └── skills/                 # AI スキル定義
├── docs/                       # ドキュメント
│   ├── architecture/           # 設計書（本ファイル群）
│   ├── requirements-and-tech.md
│   ├── stack.md
│   ├── mvp-design.md
│   ├── tasks.md
│   └── dev-diary.md
├── scripts/                    # 運用スクリプト
│   └── seed.ts                 # サンプルデータ投入
├── src/                        # アプリケーションコード
│   ├── app/                    # Next.js App Router
│   ├── components/             # 共有コンポーネント
│   ├── lib/                    # ライブラリ・ユーティリティ
│   ├── types/                  # 型定義
│   └── auth.ts                 # Auth.js 設定
├── drizzle.config.ts           # Drizzle ORM 設定
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 各ディレクトリの役割

### `.cursor/`

Cursor IDE の設定とルール。

| パス | 役割 |
|------|------|
| `rules/*.mdc` | 開発時の規約（フロントエンド・バックエンド・ワークフロー等） |
| `skills/*/SKILL.md` | AI アシスタント用のスキル定義 |

**改修時のポイント**:
- 新しい規約を追加する場合は `rules/` に `.mdc` ファイルを作成
- `.mdc` の `globs` で適用対象ファイルを指定可能

---

### `docs/`

プロジェクトのドキュメント。

| ファイル | 内容 |
|---------|------|
| `requirements-and-tech.md` | 要件定義・技術選定 |
| `stack.md` | 技術スタックの確定事項 |
| `mvp-design.md` | 画面・DB スキーマの設計案 |
| `tasks.md` | タスク管理（進行中・次にやる・完了） |
| `dev-diary.md` | 開発日記 |
| `architecture/` | 設計書（本ドキュメント群） |

**改修時のポイント**:
- タスク着手時は `tasks.md` を更新
- 意味のある変更は `dev-diary.md` に記録

---

### `scripts/`

運用・開発補助スクリプト。

| ファイル | 役割 |
|---------|------|
| `seed.ts` | サンプルデータ投入（`npm run db:seed`） |

**改修時のポイント**:
- `seed.ts` は `--force` オプションで全消去→再投入
- 新しいスクリプトを追加する場合は `package.json` の `scripts` に登録

---

### `src/app/`

Next.js App Router のルーティングとページ。

```
src/app/
├── layout.tsx              # ルートレイアウト
├── page.tsx                # トップページ（リダイレクト処理）
├── globals.css             # グローバルスタイル
├── providers.tsx           # React プロバイダ（SessionProvider 等）
├── login/
│   └── page.tsx            # ログインページ
├── register/
│   └── page.tsx            # ユーザー登録ページ
├── calendar/
│   └── page.tsx            # カレンダー（シフト閲覧）
├── me/
│   └── letter/
│       └── page.tsx        # 自分の A〜D 設定
├── admin/
│   ├── editions/
│   │   ├── page.tsx        # 版一覧
│   │   └── create-edition-form.tsx  # 版作成フォーム
│   └── month/
│       └── [editionId]/
│           └── [year]/
│               └── [month]/
│                   └── page.tsx  # 月次グリッド編集
├── actions/                # Server Actions
│   ├── register.ts         # ユーザー登録
│   ├── set-letter.ts       # A〜D 設定
│   ├── edition.ts          # 版の CRUD
│   └── save-month-cells.ts # シフトセル保存
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts    # Auth.js API ルート
```

**改修時のポイント**:

1. **ページ追加**
   - `app/` 直下に新しいディレクトリを作成し、`page.tsx` を配置
   - 動的ルートは `[param]` 形式

2. **Server Component / Client Component の判断**
   - デフォルトは Server Component
   - `useState` / `useEffect` / イベントハンドラが必要な場合のみ `"use client"`
   - 詳細は [frontend.md](./frontend.md) を参照

3. **Server Actions**
   - `app/actions/` に配置し、`"use server"` を宣言
   - ファイル名はドメイン単位（`register.ts`, `edition.ts` 等）

4. **Route Handler**
   - 現状は Auth.js の API ルートのみ
   - 新規 API が必要な場合は Server Actions を優先し、どうしても必要な場合のみ `app/api/` に追加

---

### `src/components/`

共有コンポーネント。

| ファイル | 役割 |
|---------|------|
| `sign-out-button.tsx` | ログアウトボタン（Client Component） |

**改修時のポイント**:
- 複数ページで使うコンポーネントはここに配置
- ページ固有のコンポーネントは該当 `app/` ディレクトリ内に配置（例: `create-edition-form.tsx`）
- コンポーネント名はケバブケース + `.tsx`

---

### `src/lib/`

ライブラリ・ユーティリティ。

```
src/lib/
├── db/
│   ├── index.ts        # DB 接続（drizzle + libsql）
│   └── schema.ts       # Drizzle スキーマ定義
└── dates.ts            # 日付ユーティリティ（月末日取得等）
```

| ファイル | 役割 |
|---------|------|
| `db/index.ts` | DB 接続のシングルトン |
| `db/schema.ts` | テーブル定義（users, schedule_edition, shift_cell, user_letter_binding） |
| `dates.ts` | 月末日の計算など |

**改修時のポイント**:
- 新しいテーブルは `schema.ts` に追加後、マイグレーションを生成
- ユーティリティ関数は `lib/` 直下または機能別サブディレクトリに配置

---

### `src/types/`

TypeScript 型定義。

| ファイル | 役割 |
|---------|------|
| `next-auth.d.ts` | Auth.js のセッション型拡張（`isAdmin` 等） |

**改修時のポイント**:
- セッションに新しいプロパティを追加する場合は `next-auth.d.ts` を更新

---

### `src/auth.ts`

Auth.js（next-auth v5）の設定。

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [ Credentials({ ... }) ],
  callbacks: { jwt, session },
});
```

**改修時のポイント**:
- 新しいプロバイダ（Google 等）を追加する場合は `providers` 配列に追加
- セッションにカスタムプロパティを追加する場合は `callbacks.jwt` と `callbacks.session` を更新
- 詳細は [backend.md](./backend.md) を参照

---

## ファイル命名規則

| 種別 | 命名規則 | 例 |
|------|---------|-----|
| ページ | `page.tsx` | `app/calendar/page.tsx` |
| レイアウト | `layout.tsx` | `app/layout.tsx` |
| Server Action | ドメイン名（ケバブケース） | `save-month-cells.ts` |
| コンポーネント | ケバブケース | `sign-out-button.tsx` |
| ユーティリティ | ケバブケース | `dates.ts` |
| スキーマ | `schema.ts` | `lib/db/schema.ts` |

---

## インポートパス

`@/` エイリアスで `src/` を参照。

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/auth";
```

**改修時のポイント**:
- 相対パスではなく `@/` を使用
- `tsconfig.json` の `paths` で設定済み
