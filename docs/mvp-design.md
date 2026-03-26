# MVP 設計メモ（画面・DB スキーマ案）

[requirements-and-tech.md](./requirements-and-tech.md) の MVP（**手動グリッド**・本人紐付け・最新版デフォルト）に対応するたたき台。実装時に差し替え可。

---

## 1. 画面一覧とルート案

| ルート（案） | 利用者 | 内容 |
|--------------|--------|------|
| `/` | 全員 | ログイン済みなら `/calendar` へ、未ログインなら `/login` へ。 |
| `/login` | 全員 | ログイン。 |
| `/register` | 全員 | 新規登録（本名フルネーム・メール・パスワード等）。 |
| `/calendar` | 一般 | **版（デフォルト最新）**・**月**・**A〜D 表示列**を選び、**自分の列**を初期選択。**同じ文字のユーザー（フルネーム）**一覧。 |
| `/me/letter` | 一般 | **本人のみ** `assignedLetter` を設定・変更（版は「現在有効な最新版」に紐付け）。 |
| `/admin/editions` | 管理者 | **版**の一覧・作成。 |
| `/admin/month/[editionId]/[year]/[month]` | 管理者 | A〜D × 各日のデータ編集・保存（**スマホで使いやすい** UI を優先。表・カードリスト・日ごとフォーム等は実装で選択）。 |

### 1.1 UI/UX 方針（確定）

- **モバイルファースト**: レイアウト・タップ領域は**スマホを第一**に設計する。PC は**同じ画面を広げた形**（max-width 中央寄せ等）でよい。
- **紙の再現は不要**: 情報は「版・月・A〜D・各日の 1/2/3/休」で足りる。見せ方は**読みやすさ・誤操作しにくさ**優先。
- **業務系・全年齢**: **オシャレなレイアウトやトレンド表現は目的にしない**。**文字サイズ・行間・コントラスト**を優先し、**装飾・アニメーションは最小限**（あっても邪魔にならない程度）。
- **誰でも使いやすく**: 大きめのボタン／セレクト、操作の前後が分かるラベル、可能なら [design-ui SKILL](../.cursor/skills/design-ui/SKILL.md) に沿ったコントラスト・フォーカス。
- **コンポーネント**: **shadcn/ui** を使う場合も、テーマ（色・角丸・影）を**素朴め**に寄せ、業務アプリに近い見え方に調整する（[stack.md](./stack.md)）。

---

## 2. 簡易ワイヤー（テキスト）

### 2.1 `/calendar`（利用者）

スマホでは **セグメント／チップ** で A〜D 切替、月は **ネイティブに近いピッカー** 等でもよい。

```
[版: 2025年度 ▼]  ※デフォルトは最新版
[月: 3月 ▼]
表示: [ 自分(A) ] [ A ] [ B ] [ C ] [ D ]  ← 横スクロール可能なチップでも可

（案A: 横スクロール表）
        1   2   3  ...  31
  A     1   2   休 ...

（案B: スマホ向けに「日付リスト」1列で 1日=1行 + 値）

同じ「A」のメンバー: 山田太郎、佐藤花子、...
```

### 2.2 `/admin/month/...`（管理者）

表が狭い場合は **行（A〜D）をアコーディオン**し、開いた中で日付ごとに 1/2/3/休 を選ぶ形も可。

```
版: 2025年度  |  2025年 3月
[保存] [前月] [次月]

（表が入る幅なら従来のマトリクス、入らなければ分割 UI）
```

---

## 3. DB スキーマ案（論理 → Drizzle 想定）

### 3.1 エンティティ関係（概要）

- **User** … 認証ユーザー。`fullName`（フルネーム）、`isAdmin`。
- **ScheduleEdition** … 年1回の配布単位（例: 2025年度）。
- **ShiftCell** … 1セル＝1行。**edition + year + month + letter + day** で一意。値は `1 | 2 | 3 | 休`。
- **UserLetterBinding** … **user + edition** ごとに **letter**（本人が設定）。

Auth.js 標準の `Account` / `Session` / `VerificationToken` テーブルは公式推奨に従い追加する。

### 3.2 SQL イメージ（SQLite / libSQL）

```sql
-- 版（年度の束ね）
CREATE TABLE schedule_edition (
  id TEXT PRIMARY KEY,           -- uuid
  label TEXT NOT NULL,           -- 例: 2025年度
  created_at INTEGER NOT NULL    -- unix ms
);

-- シフトセル（正規化: セル1行）
CREATE TABLE shift_cell (
  id TEXT PRIMARY KEY,
  edition_id TEXT NOT NULL REFERENCES schedule_edition(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,        -- 1-12
  letter TEXT NOT NULL,          -- 'A'|'B'|'C'|'D'
  day INTEGER NOT NULL,          -- 1..31（その月の実日数でバリデーション）
  value TEXT NOT NULL,           -- '1'|'2'|'3'|'休'
  UNIQUE (edition_id, year, month, letter, day)
);

-- アプリユーザー（Auth.js と突合わせるなら id を合わせるか user テーブルに auth id を持つ）
CREATE TABLE app_user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,   -- Credentials 用（Auth.js アダプタ方針に合わせて変更可）
  full_name TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- 版ごとの A〜D（本人設定）
CREATE TABLE user_letter_binding (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  edition_id TEXT NOT NULL REFERENCES schedule_edition(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  UNIQUE (user_id, edition_id)
);
```

**最新版の解決**: `schedule_edition.created_at` の最大、または `sort_key` 列を後から追加して「最新」を明示。

### 3.3 制約（アプリ側）

- `shift_cell` 投入時、`day` がその月の末日を超えないこと（うるう年・2月を含む）。
- セル値は `1|2|3|休` のみ（CHECK または Zod）。

---

## 4. API / Server Actions（案）

MVP では **Server Actions** または **Route Handler** のどちらかに寄せて統一する（[backend-next SKILL](../.cursor/skills/backend-next/SKILL.md)）。

例:

- `getLatestEdition()`, `listEditions()`
- `getMonthGrid(editionId, year, month)` → A〜D × 日のマトリクス
- `upsertShiftCells(...)`（管理者のみ）
- `setUserLetter(editionId, letter)`（本人のみ）
- `listUsersByLetter(editionId, letter)` → フルネーム一覧（ログイン済み相互閲覧前提）

---

## 5. フェーズ2（画像取り込み）メモ

- **レイアウト固定**を利用し、画像上の**正規化座標**（0–1）または絶対座標でセル矩形を定義。
- 切り出し画像に **Tesseract.js**（クライアント）または **Cloud Vision**（サーバ）で文字認識。
- 結果を **同一 `shift_cell` 編集 UI** に流し込み、**手動確定**。

実装決定後、`docs/stack.md` の §2 に具体ライブラリを追記する。
