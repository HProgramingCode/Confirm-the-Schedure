# データフロー・シーケンス図

主要なユースケースのデータフローとシーケンス図を示す。

---

## 1. 全体のデータフロー

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ユーザー操作                                 │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│  ページ遷移     │  │  フォーム送信   │  │  クライアント操作       │
│  (GET)          │  │  (Server Action)│  │  (Client Component)     │
└────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘
         │                    │                        │
         ▼                    ▼                        │
┌─────────────────┐  ┌─────────────────┐              │
│ Server Component│  │ Server Action   │              │
│ - auth()        │  │ - auth()        │              │
│ - db.select()   │  │ - validate()    │              │
│                 │  │ - db.insert/    │              │
│                 │  │   update/delete │              │
│                 │  │ - revalidate()  │              │
└────────┬────────┘  └────────┬────────┘              │
         │                    │                        │
         └────────────────────┴────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Database     │
                    │ (SQLite/Turso)  │
                    └─────────────────┘
```

---

## 2. ユーザー登録フロー

### シーケンス図

```
┌────────┐          ┌─────────────────┐          ┌──────────────┐          ┌────────┐
│ ブラウザ │          │  RegisterPage   │          │registerAction│          │   DB   │
└───┬────┘          │ (Server Comp.)  │          │(Server Action)│          └───┬────┘
    │               └────────┬────────┘          └──────┬───────┘              │
    │ GET /register          │                         │                       │
    │──────────────────────>│                         │                       │
    │                       │                         │                       │
    │      HTML (フォーム)   │                         │                       │
    │<──────────────────────│                         │                       │
    │                       │                         │                       │
    │ form submit (email, password, fullName)         │                       │
    │──────────────────────────────────────────────>│                       │
    │                       │                         │                       │
    │                       │                         │ SELECT COUNT(*) users │
    │                       │                         │──────────────────────>│
    │                       │                         │        count          │
    │                       │                         │<──────────────────────│
    │                       │                         │                       │
    │                       │                         │ INSERT users          │
    │                       │                         │──────────────────────>│
    │                       │                         │         ok            │
    │                       │                         │<──────────────────────│
    │                       │                         │                       │
    │       redirect /login?registered=1              │                       │
    │<──────────────────────────────────────────────│                       │
    │                       │                         │                       │
```

### データフロー詳細

```
1. ユーザー入力
   ├── email: "user@example.com"
   ├── password: "password123"
   └── fullName: "山田太郎"

2. バリデーション（registerAction）
   ├── 空チェック
   └── パスワード 8文字以上

3. 初回ユーザー判定
   └── SELECT COUNT(*) FROM user → 0 なら isAdmin = true

4. パスワードハッシュ化
   └── bcrypt.hash(password, 10) → passwordHash

5. DB 挿入
   └── INSERT INTO user (id, email, password_hash, full_name, is_admin, created_at)

6. リダイレクト
   └── /login?registered=1
```

---

## 3. ログインフロー

### シーケンス図

```
┌────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────┐
│ ブラウザ │     │  LoginPage   │     │ Auth.js         │     │   DB   │
└───┬────┘     │(Server Comp.)│     │ (authorize)     │     └───┬────┘
    │          └──────┬───────┘     └────────┬────────┘         │
    │ GET /login      │                      │                   │
    │────────────────>│                      │                   │
    │                 │                      │                   │
    │ HTML (フォーム)  │                      │                   │
    │<────────────────│                      │                   │
    │                 │                      │                   │
    │ form submit (email, password)          │                   │
    │──────────────────────────────────────>│                   │
    │                 │                      │                   │
    │                 │                      │ SELECT * FROM user│
    │                 │                      │ WHERE email = ?   │
    │                 │                      │─────────────────>│
    │                 │                      │       user        │
    │                 │                      │<─────────────────│
    │                 │                      │                   │
    │                 │                      │ bcrypt.compare()  │
    │                 │                      │                   │
    │                 │                      │ JWT 生成          │
    │                 │                      │                   │
    │ Set-Cookie: auth-token (JWT)           │                   │
    │<─────────────────────────────────────│                   │
    │                 │                      │                   │
    │ redirect /calendar                     │                   │
    │<─────────────────────────────────────│                   │
```

### JWT の構造

```json
{
  "id": "uuid-xxx",
  "email": "user@example.com",
  "name": "山田太郎",
  "isAdmin": false,
  "iat": 1711411200,
  "exp": 1714003200
}
```

---

## 4. カレンダー閲覧フロー

### シーケンス図

```
┌────────┐     ┌──────────────────┐     ┌────────────┐     ┌────────┐
│ ブラウザ │     │  CalendarPage    │     │   auth()   │     │   DB   │
└───┬────┘     │ (Server Comp.)   │     └─────┬──────┘     └───┬────┘
    │          └────────┬─────────┘           │                 │
    │ GET /calendar?view=A                    │                 │
    │─────────────────>│                      │                 │
    │                  │                      │                 │
    │                  │ セッション取得        │                 │
    │                  │─────────────────────>│                 │
    │                  │      session         │                 │
    │                  │<─────────────────────│                 │
    │                  │                      │                 │
    │                  │ 最新版を取得                            │
    │                  │──────────────────────────────────────>│
    │                  │ SELECT * FROM schedule_edition        │
    │                  │ ORDER BY created_at DESC LIMIT 1      │
    │                  │              edition                   │
    │                  │<──────────────────────────────────────│
    │                  │                      │                 │
    │                  │ ユーザーの紐付けを取得                   │
    │                  │──────────────────────────────────────>│
    │                  │ SELECT * FROM user_letter_binding     │
    │                  │ WHERE user_id = ? AND edition_id = ?  │
    │                  │              binding                   │
    │                  │<──────────────────────────────────────│
    │                  │                      │                 │
    │                  │ シフトセルを取得                        │
    │                  │──────────────────────────────────────>│
    │                  │ SELECT * FROM shift_cell              │
    │                  │ WHERE edition_id = ? AND letter = ?   │
    │                  │               cells                    │
    │                  │<──────────────────────────────────────│
    │                  │                      │                 │
    │                  │ 同列メンバーを取得                      │
    │                  │──────────────────────────────────────>│
    │                  │ SELECT users.full_name FROM users     │
    │                  │ JOIN user_letter_binding ...          │
    │                  │             colleagues                 │
    │                  │<──────────────────────────────────────│
    │                  │                      │                 │
    │       HTML (カレンダー表示)              │                 │
    │<─────────────────│                      │                 │
```

### クエリ一覧

| 順序 | クエリ | 目的 |
|------|--------|------|
| 1 | `SELECT * FROM schedule_edition ORDER BY created_at DESC LIMIT 1` | 最新版の取得 |
| 2 | `SELECT * FROM user_letter_binding WHERE user_id = ? AND edition_id = ?` | ユーザーの列設定 |
| 3 | `SELECT * FROM shift_cell WHERE edition_id = ? AND year = ? AND month = ? AND letter = ?` | シフトセル |
| 4 | `SELECT users.full_name FROM users JOIN user_letter_binding ...` | 同列メンバー |

---

## 5. シフトセル保存フロー（管理者）

### シーケンス図

```
┌────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌────────┐
│ ブラウザ │     │  AdminMonthPage  │     │saveMonthCells   │     │   DB   │
└───┬────┘     │ (Server Comp.)   │     │Action           │     └───┬────┘
    │          └────────┬─────────┘     └────────┬────────┘         │
    │                   │                        │                   │
    │ form submit (A-1=1, A-2=2, A-3=休, ...)    │                   │
    │─────────────────────────────────────────>│                   │
    │                   │                        │                   │
    │                   │                        │ auth() → isAdmin  │
    │                   │                        │                   │
    │                   │                        │ ループ: A〜D × 日  │
    │                   │                        │                   │
    │                   │                        │ 値が空 → DELETE   │
    │                   │                        │─────────────────>│
    │                   │                        │                   │
    │                   │                        │ 値がある → UPSERT │
    │                   │                        │─────────────────>│
    │                   │                        │                   │
    │                   │                        │ revalidatePath()  │
    │                   │                        │                   │
    │       { ok: true }                         │                   │
    │<───────────────────────────────────────────│                   │
```

### UPSERT の動作

```sql
-- 既存セルがない場合: INSERT
INSERT INTO shift_cell (id, edition_id, year, month, letter, day, value)
VALUES (?, ?, ?, ?, 'A', 1, '1');

-- 既存セルがある場合: UPDATE（ON CONFLICT）
INSERT INTO shift_cell (id, edition_id, year, month, letter, day, value)
VALUES (?, ?, ?, ?, 'A', 1, '2')
ON CONFLICT (edition_id, year, month, letter, day)
DO UPDATE SET value = '2';
```

---

## 6. A〜D 設定フロー

### シーケンス図

```
┌────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌────────┐
│ ブラウザ │     │  MeLetterPage    │     │setLetterAction  │     │   DB   │
└───┬────┘     │ (Server Comp.)   │     │                 │     └───┬────┘
    │          └────────┬─────────┘     └────────┬────────┘         │
    │                   │                        │                   │
    │ form submit (letter=B)                     │                   │
    │──────────────────────────────────────────>│                   │
    │                   │                        │                   │
    │                   │                        │ auth() → user.id  │
    │                   │                        │                   │
    │                   │                        │ 最新版を取得       │
    │                   │                        │─────────────────>│
    │                   │                        │      edition      │
    │                   │                        │<─────────────────│
    │                   │                        │                   │
    │                   │                        │ 既存紐付けを確認   │
    │                   │                        │─────────────────>│
    │                   │                        │ binding or null   │
    │                   │                        │<─────────────────│
    │                   │                        │                   │
    │                   │                        │ UPDATE or INSERT  │
    │                   │                        │─────────────────>│
    │                   │                        │                   │
    │                   │                        │ revalidatePath()  │
    │                   │                        │                   │
    │       { ok: true }                         │                   │
    │<───────────────────────────────────────────│                   │
```

---

## 7. エラーハンドリングフロー

### 一般的なエラーパターン

```
┌──────────────────┐
│  Server Action   │
└────────┬─────────┘
         │
         ├── 認証エラー
         │   └── return { error: "ログインが必要です。" }
         │
         ├── 認可エラー
         │   └── return { error: "権限がありません。" }
         │
         ├── バリデーションエラー
         │   └── return { error: "入力値が不正です。" }
         │
         ├── DB エラー
         │   └── try-catch → return { error: "保存に失敗しました。" }
         │
         └── 成功
             └── return { ok: true }
```

### クライアント側でのエラー表示

```tsx
"use client";

export function MyForm() {
  const [state, formAction, pending] = useActionState(myAction, {});

  return (
    <form action={formAction}>
      {/* エラーメッセージ表示 */}
      {state.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}

      <input name="field" disabled={pending} />

      <button type="submit" disabled={pending}>
        {pending ? "処理中..." : "送信"}
      </button>
    </form>
  );
}
```

---

## 8. キャッシュ無効化の対応表

| Server Action | revalidatePath |
|---------------|----------------|
| `registerAction` | なし（リダイレクト） |
| `setLetterAction` | `/calendar`, `/me/letter` |
| `createEditionAction` | `/admin/editions` |
| `saveMonthCellsAction` | `/calendar`, `/admin/month/[editionId]/[year]/[month]` |

**キャッシュ無効化のタイミング**:
- データ変更が成功した後
- 関連するすべてのページパスを指定
