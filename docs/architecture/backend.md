# バックエンド設計書

本ドキュメントは DB 設計・認証・Server Actions の実装方針を解説する。

---

## 1. データベース

### 1.1 技術スタック

| 項目 | 選定 |
|------|------|
| DBMS（ローカル） | SQLite（`file:local.db`） |
| DBMS（本番） | Turso（libSQL） |
| ORM | Drizzle ORM |
| クライアント | `@libsql/client` |
| マイグレーション | `drizzle-kit` |

### 1.2 接続設定

```typescript
// src/lib/db/index.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:local.db";
const client = createClient({ url });
export const db = drizzle(client, { schema });
```

**環境変数**:

| 変数名 | 用途 | 例 |
|--------|------|-----|
| `DATABASE_URL` | Turso の接続 URL | `libsql://xxx.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso の認証トークン（必要な場合） | `eyJ...` |

### 1.3 スキーマ定義

```typescript
// src/lib/db/schema.ts
```

**テーブル一覧**:

| テーブル名 | 用途 |
|-----------|------|
| `user` | アプリユーザー |
| `schedule_edition` | 版（年度の束ね） |
| `shift_cell` | シフトセル（A〜D × 日） |
| `user_letter_binding` | ユーザーと A〜D の紐付け |

---

### 1.4 テーブル詳細

#### `user`

```typescript
export const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "number" }).notNull()
    .$defaultFn(() => Date.now()),
});
```

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (UUID) | 主キー |
| `email` | TEXT | メールアドレス（ユニーク） |
| `password_hash` | TEXT | bcrypt ハッシュ |
| `full_name` | TEXT | 氏名（フルネーム） |
| `is_admin` | INTEGER (boolean) | 管理者フラグ |
| `created_at` | INTEGER (Unix ms) | 作成日時 |

**備考**:
- 初回登録ユーザーは自動的に `isAdmin = true` になる
- パスワードは bcrypt（コスト 10）でハッシュ化

---

#### `schedule_edition`

```typescript
export const scheduleEdition = sqliteTable("schedule_edition", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull()
    .$defaultFn(() => Date.now()),
});
```

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (UUID) | 主キー |
| `label` | TEXT | 表示名（例: 2025年度） |
| `created_at` | INTEGER (Unix ms) | 作成日時（最新版の判定に使用） |

**備考**:
- 「最新版」は `created_at DESC` で取得

---

#### `shift_cell`

```typescript
export const shiftCell = sqliteTable(
  "shift_cell",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    editionId: text("edition_id").notNull()
      .references(() => scheduleEdition.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    letter: text("letter").notNull(),
    day: integer("day").notNull(),
    value: text("value").notNull(),
  },
  (t) => [
    uniqueIndex("shift_cell_edition_ymld").on(
      t.editionId, t.year, t.month, t.letter, t.day
    ),
  ],
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (UUID) | 主キー |
| `edition_id` | TEXT (FK) | 版への参照 |
| `year` | INTEGER | 年（例: 2025） |
| `month` | INTEGER | 月（1〜12） |
| `letter` | TEXT | 列（A / B / C / D） |
| `day` | INTEGER | 日（1〜31） |
| `value` | TEXT | セル値（1 / 2 / 3 / 休） |

**制約**:
- `(edition_id, year, month, letter, day)` はユニーク
- `edition_id` の削除時は CASCADE で連動削除

---

#### `user_letter_binding`

```typescript
export const userLetterBinding = sqliteTable(
  "user_letter_binding",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    editionId: text("edition_id").notNull()
      .references(() => scheduleEdition.id, { onDelete: "cascade" }),
    letter: text("letter").notNull(),
  },
  (t) => [
    uniqueIndex("user_letter_binding_user_edition").on(t.userId, t.editionId),
  ],
);
```

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (UUID) | 主キー |
| `user_id` | TEXT (FK) | ユーザーへの参照 |
| `edition_id` | TEXT (FK) | 版への参照 |
| `letter` | TEXT | 割当列（A / B / C / D） |

**制約**:
- `(user_id, edition_id)` はユニーク（1ユーザーは版ごとに1列のみ）

---

### 1.5 マイグレーション

**コマンド**:

```bash
# スキーマからマイグレーションファイルを生成
npm run db:generate

# マイグレーションを適用
npm run db:migrate

# サンプルデータ投入（開発用）
npm run db:seed
```

**改修時のフロー**:

1. `src/lib/db/schema.ts` を編集
2. `npm run db:generate` でマイグレーションファイル生成
3. `npm run db:migrate` で DB に反映
4. 動作確認

---

## 2. 認証（Auth.js v5）

### 2.1 設定概要

```typescript
// src/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "メール", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        // 認証処理
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { /* JWT にカスタムプロパティを追加 */ },
    async session({ session, token }) { /* セッションにカスタムプロパティを追加 */ },
  },
});
```

### 2.2 セッション構造

```typescript
// src/types/next-auth.d.ts
declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
    };
  }
}
```

**JWT に含まれるカスタムプロパティ**:

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `id` | string | ユーザー ID |
| `isAdmin` | boolean | 管理者フラグ |

### 2.3 認証フロー

```
1. ユーザーがログインフォームを送信
   ↓
2. Credentials プロバイダの authorize() が実行
   - email でユーザーを DB 検索
   - bcrypt.compare() でパスワード検証
   ↓
3. 成功時、jwt コールバックで JWT にカスタムプロパティを追加
   ↓
4. session コールバックで Session オブジェクトに反映
   ↓
5. クライアント/サーバーで session.user.* が利用可能
```

### 2.4 認証チェックの実装

**Server Component**:

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  // 未ログイン時はリダイレクト
  if (!session?.user) {
    redirect("/login");
  }

  // 管理者のみアクセス可能
  if (!session.user.isAdmin) {
    redirect("/calendar");
  }

  return <div>管理者コンテンツ</div>;
}
```

**Server Action**:

```typescript
"use server";

import { auth } from "@/auth";

export async function adminOnlyAction() {
  const session = await auth();

  // 認可チェック
  if (!session?.user?.isAdmin) {
    return { error: "権限がありません。" };
  }

  // 管理者のみの処理
}
```

---

## 3. Server Actions

### 3.1 配置と命名

| ディレクトリ | ファイル名 | 用途 |
|-------------|-----------|------|
| `src/app/actions/` | `register.ts` | ユーザー登録 |
| | `set-letter.ts` | A〜D 設定 |
| | `edition.ts` | 版の CRUD |
| | `save-month-cells.ts` | シフトセル保存 |

**命名規則**:
- ファイル名: ケバブケース（`save-month-cells.ts`）
- 関数名: キャメルケース + `Action` サフィックス（`saveMonthCellsAction`）

### 3.2 実装パターン

**基本構造**:

```typescript
"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type ActionState = {
  error?: string;
  ok?: boolean;
};

export async function myAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // 1. 認証・認可チェック
  const session = await auth();
  if (!session?.user) {
    return { error: "ログインが必要です。" };
  }

  // 2. 入力値の取得・バリデーション
  const value = String(formData.get("field") ?? "").trim();
  if (!value) {
    return { error: "値を入力してください。" };
  }

  // 3. DB 操作
  try {
    await db.insert(table).values({ ... });
  } catch {
    return { error: "保存に失敗しました。" };
  }

  // 4. キャッシュ無効化
  revalidatePath("/target-page");

  // 5. 成功レスポンス
  return { ok: true };
}
```

### 3.3 既存の Server Actions

#### `registerAction`

```typescript
// src/app/actions/register.ts
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState>
```

**処理**:
1. メール・パスワード・氏名のバリデーション
2. 初回登録者を管理者に設定
3. bcrypt でパスワードハッシュ化
4. DB に INSERT
5. `/login` にリダイレクト

---

#### `saveMonthCellsAction`

```typescript
// src/app/actions/save-month-cells.ts
export async function saveMonthCellsAction(
  editionId: string,
  year: number,
  month: number,
  formData: FormData,
)
```

**処理**:
1. 管理者権限チェック
2. A〜D × 日のセルを FormData から取得
3. 空欄は DELETE、値があれば UPSERT
4. `/calendar` と該当ページのキャッシュ無効化

---

#### `setLetterAction`

```typescript
// src/app/actions/set-letter.ts
export async function setLetterAction(
  _prev: SetLetterState,
  formData: FormData,
): Promise<SetLetterState>
```

**処理**:
1. ログインユーザーの取得
2. 最新版の取得
3. A〜D のバリデーション
4. 既存の紐付けがあれば UPDATE、なければ INSERT
5. `/calendar` と `/me/letter` のキャッシュ無効化

---

#### `createEditionAction`

```typescript
// src/app/actions/edition.ts
export async function createEditionAction(
  _prev: EditionState,
  formData: FormData,
): Promise<EditionState>
```

**処理**:
1. 管理者権限チェック
2. ラベルのバリデーション
3. DB に INSERT
4. `/admin/editions` のキャッシュ無効化

---

## 4. バリデーション

### 4.1 方針

- フォーム入力は Server Action 内でバリデーション
- 複雑なバリデーションは Zod を使用（現在は未導入）
- エラーメッセージは日本語で返却

### 4.2 許可値の定義

```typescript
// 列の許可値
const LETTERS = ["A", "B", "C", "D"] as const;

// セル値の許可値
const VALUES = ["1", "2", "3", "休"] as const;
```

### 4.3 Zod 導入時の例

```typescript
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  fullName: z.string().min(1, "氏名を入力してください"),
});

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const result = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  // 以降の処理...
}
```

---

## 5. 改修時のチェックリスト

### テーブルを追加する場合

- [ ] `src/lib/db/schema.ts` にテーブル定義を追加
- [ ] `npm run db:generate` でマイグレーション生成
- [ ] `npm run db:migrate` で適用
- [ ] 必要に応じて `scripts/seed.ts` を更新

### Server Action を追加する場合

- [ ] `src/app/actions/` にファイルを作成
- [ ] `"use server"` を宣言
- [ ] 認証・認可チェックを実装
- [ ] 入力値のバリデーションを実装
- [ ] エラーハンドリングを実装
- [ ] `revalidatePath` でキャッシュ無効化

### 認証にカスタムプロパティを追加する場合

- [ ] `src/types/next-auth.d.ts` を更新
- [ ] `src/auth.ts` の `jwt` と `session` コールバックを更新
- [ ] 該当プロパティを DB から取得するよう `authorize` を更新
