# フロントエンド設計書

本ドキュメントは `.cursor/rules/frontend-nextjs.mdc` の方針を詳細に解説し、第三者が実装・改修を行う際の指針を提供する。

---

## 1. コンポーネント境界

### 1.1 Server Component（デフォルト）

Next.js App Router では、**すべてのコンポーネントはデフォルトで Server Component** である。

**Server Component の特徴**:
- サーバーでのみ実行される（クライアントにコードが送られない）
- DB や内部 API に直接アクセス可能
- `async/await` でデータ取得可能
- バンドルサイズに影響しない

**Server Component で実装すべきもの**:
- ページコンポーネント（`page.tsx`）
- データ表示のみのコンポーネント
- レイアウト（`layout.tsx`）

**実装例（カレンダーページ）**:

```typescript
// src/app/calendar/page.tsx
// "use client" を付けていないので Server Component

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { shiftCell } from "@/lib/db/schema";

export default async function CalendarPage() {
  // サーバーで認証状態を取得
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // サーバーで DB に直接アクセス
  const cells = await db.select().from(shiftCell).where(...);

  return (
    <div>
      {/* データを表示 */}
    </div>
  );
}
```

---

### 1.2 Client Component（必要な場合のみ）

**以下の場合に `"use client"` を付与する**:

| 必要な機能 | 例 |
|-----------|-----|
| `useState` / `useReducer` | フォームの入力状態管理 |
| `useEffect` | マウント時の処理、副作用 |
| イベントハンドラ | `onClick`, `onChange`, `onSubmit` |
| ブラウザ API | `localStorage`, `window` |
| React Context の `useContext` | テーマ、認証状態の購読 |

**重要: Client Component は必要最小限に閉じ込める**

```
❌ 悪い例: ページ全体を Client Component にする

"use client";
export default function CalendarPage() {
  // ページ全体がクライアントにバンドルされる
}
```

```
✅ 良い例: インタラクションが必要な部分だけを分離

// page.tsx（Server Component）
export default async function CalendarPage() {
  const data = await fetchData();
  return (
    <div>
      <h1>カレンダー</h1>
      <InteractiveFilter /> {/* Client Component */}
      <DataDisplay data={data} /> {/* Server Component のまま */}
    </div>
  );
}

// interactive-filter.tsx（Client Component）
"use client";
export function InteractiveFilter() {
  const [filter, setFilter] = useState("");
  return <input onChange={(e) => setFilter(e.target.value)} />;
}
```

---

### 1.3 現在のコードベースでの適用例

| ファイル | 種別 | 理由 |
|---------|------|------|
| `app/calendar/page.tsx` | Server | DB アクセス、認証チェック |
| `app/login/page.tsx` | Server | フォーム送信は Server Action で処理 |
| `components/sign-out-button.tsx` | Client | `signOut()` のクリックハンドラ |
| `app/admin/editions/create-edition-form.tsx` | Client | `useActionState` でフォーム状態管理 |

---

## 2. 状態管理（Zustand）

### 2.1 基本方針

```
┌─────────────────────────────────────────────────────────────┐
│  データの正（Source of Truth）                              │
├─────────────────────────────────────────────────────────────┤
│  1. URL パラメータ  → searchParams, pathname                │
│  2. サーバー（DB）  → Server Component でフェッチ           │
│  3. クライアント状態 → Zustand（一時的な UI 状態のみ）      │
└─────────────────────────────────────────────────────────────┘
```

**Zustand を使うべき場面**:
- モーダルの開閉状態
- グリッド編集の一時的な入力値
- ドラッグ&ドロップの状態

**Zustand を使うべきでない場面**:
- ページ間で共有するデータ → URL パラメータを使う
- サーバーから取得したデータのキャッシュ → Server Component で再取得

### 2.2 ストア設計の原則

```typescript
// ✅ 良い例: ドメイン・機能ごとにストアを分割
// store/grid-edit-store.ts
import { create } from 'zustand';

interface GridEditStore {
  pendingChanges: Map<string, string>;
  setPendingChange: (key: string, value: string) => void;
  clearChanges: () => void;
}

export const useGridEditStore = create<GridEditStore>((set) => ({
  pendingChanges: new Map(),
  setPendingChange: (key, value) =>
    set((state) => {
      const next = new Map(state.pendingChanges);
      next.set(key, value);
      return { pendingChanges: next };
    }),
  clearChanges: () => set({ pendingChanges: new Map() }),
}));
```

### 2.3 現在のコードベースでの状況

現時点では Zustand ストアは未使用。今後、以下の場面で導入を検討:

- 月次グリッド編集の入力値バッファ
- フィルタ状態の一時保持（URL に反映する前の中間状態）

---

## 3. データ取得

### 3.1 Server Component でのデータ取得

**推奨パターン**:

```typescript
// app/calendar/page.tsx
export default async function CalendarPage() {
  // 1. 認証チェック
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2. DB から直接データ取得
  const cells = await db
    .select()
    .from(shiftCell)
    .where(eq(shiftCell.editionId, editionId));

  // 3. データを整形
  const byDay = new Map<number, string>();
  for (const c of cells) {
    byDay.set(c.day, c.value);
  }

  // 4. 表示
  return <CalendarDisplay data={byDay} />;
}
```

### 3.2 キャッシュ方針

現在のアプリでは、ページ遷移ごとに最新データを取得する方針。

**キャッシュを明示的に制御する場合**:

```typescript
// 再検証を無効化（静的にキャッシュ）
export const revalidate = false;

// 一定時間後に再検証
export const revalidate = 60; // 60秒
```

**Server Actions でのキャッシュ無効化**:

```typescript
import { revalidatePath } from "next/cache";

export async function saveData() {
  // DB 更新後にキャッシュを無効化
  revalidatePath("/calendar");
}
```

---

## 4. フォーム・ナビゲーション

### 4.1 Server Actions でのフォーム処理

**推奨パターン**:

```typescript
// app/actions/register.ts
"use server";

import { redirect } from "next/navigation";

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // 1. バリデーション
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "メールを入力してください。" };
  }

  // 2. DB 操作
  try {
    await db.insert(users).values({ email, ... });
  } catch {
    return { error: "登録に失敗しました。" };
  }

  // 3. 成功時はリダイレクト
  redirect("/login?registered=1");
}
```

```typescript
// app/register/page.tsx
"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/register";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction}>
      <input name="email" type="email" disabled={pending} />
      {state.error && <p className="text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}>
        登録
      </button>
    </form>
  );
}
```

### 4.2 認証状態の取得

**Server Component**:

```typescript
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // session.user.id, session.user.isAdmin が利用可能
}
```

**Client Component**:

```typescript
"use client";

import { useSession } from "next-auth/react";

export function UserInfo() {
  const { data: session } = useSession();
  return <span>{session?.user?.name}</span>;
}
```

---

## 5. スタイリング

### 5.1 Tailwind CSS

**基本方針**:
- Tailwind ユーティリティクラスを使用
- CSS Modules や styled-components との混在は避ける
- カスタム CSS が必要な場合は `globals.css` に追記

**モバイルファーストの記述**:

```tsx
// ✅ モバイル → 大画面の順で記述
<div className="px-4 py-6 md:px-8 lg:px-12">
  <h1 className="text-xl md:text-2xl lg:text-3xl">見出し</h1>
</div>
```

### 5.2 shadcn/ui の使用方針

**導入時のテーマ調整**:
- 角丸を控えめに（業務系 UI 向け）
- 影を最小限に
- 文字サイズを大きめに（全年齢対応）

**コンポーネントの追加**:

```bash
npx shadcn@latest add button
```

追加されたコンポーネントは `src/components/ui/` に配置される。

---

## 6. アクセシビリティ

### 6.1 基本対応

| 項目 | 対応方針 |
|------|---------|
| フォーカス表示 | Tailwind の `focus:ring-*` を使用 |
| タップ領域 | 最小 44x44px を確保 |
| コントラスト | WCAG AA 準拠を目指す |
| セマンティック HTML | 適切な要素を使用（`<button>`, `<nav>`, `<main>` 等） |

### 6.2 実装例

```tsx
// タップ領域の確保
<button className="min-h-11 min-w-11 px-4 py-2">
  ボタン
</button>

// フォーカスリングの表示
<input className="focus:ring-2 focus:ring-blue-500 focus:outline-none" />

// セマンティックなナビゲーション
<nav aria-label="表示する列">
  <Link href="/calendar?view=A">A</Link>
  <Link href="/calendar?view=B">B</Link>
</nav>
```

---

## 7. 改修時のチェックリスト

### 新しいページを追加する場合

- [ ] `app/` にディレクトリと `page.tsx` を作成
- [ ] Server Component をデフォルトとし、必要な部分のみ Client Component に
- [ ] 認証が必要なページは `auth()` でセッションチェック
- [ ] モバイルファーストでスタイリング

### 既存ページを修正する場合

- [ ] Server / Client の境界を変更していないか確認
- [ ] `"use client"` の追加は本当に必要か再検討
- [ ] Zustand を使う場合は一時的な UI 状態に限定

### フォームを追加する場合

- [ ] Server Action を `app/actions/` に作成
- [ ] `useActionState` でフォーム状態を管理
- [ ] エラー表示を実装
- [ ] 成功時のリダイレクトを実装

### スタイルを追加する場合

- [ ] Tailwind ユーティリティを優先
- [ ] モバイルファーストで記述
- [ ] タップ領域とフォーカス表示を確認
