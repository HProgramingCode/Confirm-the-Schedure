# 開発日記

## 記録一覧

### 2026-03-26（会話からジュニア向けナレッジへ自動反映するルール）

- **内容**: `.cursor/rules/junior-knowledge-from-sessions.mdc`（alwaysApply）を追加。会話・作業の区切りで「ジュニアが成長できる知識」か判定し、`docs/dev-diary.md` または `docs/notes/`（junior-note 形式）へ同一セッション内で反映する運用を明文化。`workflow-progress.mdc` から参照。`docs/templates/junior-note.md` をプロジェクトに配置、`docs/notes/` を用意。
- **触ったファイル**: `.cursor/rules/junior-knowledge-from-sessions.mdc`, `.cursor/rules/workflow-progress.mdc`, `docs/templates/junior-note.md`, `docs/notes/.gitkeep`, `docs/dev-diary.md`

### 2026-03-26（アーキテクチャ設計書の作成）

- **内容**: `docs/architecture/` フォルダを作成し、以下の設計書を整備。
  - `README.md` — アーキテクチャ概要・システム構成図・レイヤー構成
  - `folder-structure.md` — ディレクトリ構成の詳細解説
  - `frontend.md` — フロントエンド設計（`.cursor/rules/frontend-nextjs.mdc` の方針を反映）
  - `backend.md` — バックエンド設計（DB スキーマ・認証・Server Actions）
  - `data-flow.md` — 主要ユースケースのデータフロー・シーケンス図
- **目的**: 第三者が実装・改修を行う際に参照できる設計ドキュメントの整備。
- **触ったファイル**: `docs/architecture/*.md`, `docs/tasks.md`, `docs/dev-diary.md`

### 2026-03-26（シード: 年を実行時に合わせて /calendar に 123休 を表示）

- **内容**: `scripts/seed.ts` の `shift_cell` 年を `new Date().getFullYear()` に変更（カレンダーが「今年・今月」参照のため、固定 2025 だと年がずれるとセル空）。版ラベルも同年に。README 整合。
- **触ったファイル**: `scripts/seed.ts`, `README.md`, `docs/dev-diary.md`

### 2025-03-26（シード拡張: 3〜6月・A/B/C 各3名）

- **内容**: `scripts/seed.ts` を 2025年3〜6月の `shift_cell`、A/B/C 列ユーザー各3名（計9名・`demo1234`、管理者は `a1@example.com`）、A〜D 行のセル生成に変更。README のサンプル節を整合。
- **触ったファイル**: `scripts/seed.ts`, `README.md`, `docs/dev-diary.md`

### 2025-03-26（サンプルデータ）

- **内容**: `scripts/seed.ts`・`npm run db:seed`（空 DB 用／`--force` で全消去後投入）。当月の shift_cell、版、管理者＋一般ユーザー（パスワード `demo1234`）。README に記載。
- **触ったファイル**: `scripts/seed.ts`, `package.json`, `README.md`, `docs/tasks.md`, `docs/dev-diary.md`

### 2025-03-26（アプリスキャフォールド実装）

- **内容**: `create-next-app` を `schedure-tmp` 経由でルートにマージ（npm の大文字パッケージ名制約のため）。Drizzle + libSQL（`local.db`）、`src/lib/db/schema.ts`（user / schedule_edition / shift_cell / user_letter_binding）、Auth.js v5 Credentials + JWT、`/login` `/register`（初回＝管理者）`/calendar`（A〜D タブで他列表示）`/me/letter` `/admin/editions` `/admin/month/...`（月次セル保存）。`next build` は `--webpack`（Turbopack/SWC 問題回避）。README・[stack.md](./stack.md) 更新。
- **触ったファイル**: `package.json`, `src/**`, `drizzle.config.ts`, `README.md`, `.env.example`, `.gitignore`, `docs/stack.md`, `docs/tasks.md`, `docs/dev-diary.md`

### 2025-03-26（業務系UI・shadcn）

- **内容**: オシャレさより全年齢で見やすく使いやすい業務トーン。shadcn 可・テーマは素朴めに調整を要件 §1.3・§4・§6.3、[mvp-design](./mvp-design.md) §1.1、[stack](./stack.md) UI 行に反映。
- **触ったファイル**: `docs/requirements-and-tech.md`, `docs/mvp-design.md`, `docs/stack.md`, `docs/dev-diary.md`

### 2025-03-26（UI方針変更）

- **内容**: 紙レイアウト再現は必須としない。**スマホメイン**・画面崩れ防止・誰でも使いやすい UI/UX を要件 §1.3・§4・§6.3、 [mvp-design.md](./mvp-design.md) §1.1、[stack.md](./stack.md) UI 行に反映。
- **触ったファイル**: `docs/requirements-and-tech.md`, `docs/mvp-design.md`, `docs/stack.md`, `docs/dev-diary.md`

### 2025-03-26（次ステップ: stack・設計メモ）

- **内容**: [stack.md](./stack.md) に Next.js / Turso・SQLite / Drizzle / Auth.js / Zustand 等を確定記載。[mvp-design.md](./mvp-design.md) にルート案・ASCII ワイヤー・SQL スキーマ案・API 案。requirements §7.3 を更新。
- **触ったファイル**: `docs/stack.md`, `docs/mvp-design.md`, `docs/requirements-and-tech.md`, `docs/tasks.md`, `docs/dev-diary.md`

### 2025-03-26（未決の確定）

- **内容**: 紐付けは本人のみ、同列は本名フルネーム、版はデフォルト最新、データ入力は先に手動で後から画像（座標＋OCR想定）、UI は紙ベース、個人開発で会社非連携を [requirements-and-tech.md](./requirements-and-tech.md) に反映。
- **触ったファイル**: `docs/requirements-and-tech.md`, `docs/dev-diary.md`

### 2025-03-26（追記）

- **内容**: 紙はレイアウト毎年同一・セル内容は年度・月で変化する旨、および Next.js での画像取り込み（Tesseract.js / Cloud Vision / 手入力 / ハイブリッド）と無料枠・年十回未満想定を [requirements-and-tech.md](./requirements-and-tech.md) の §1.2・§5・§6 に反映。
- **触ったファイル**: `docs/requirements-and-tech.md`, `docs/dev-diary.md`

### 2025-03-26

- **内容**: 要件の洗練。会話で確定した MVP（A〜D のみ・年1回配布・写真取り込み・ユーザー紐付け・カレンダー表示、31日等は紙準拠、班別は将来）を [requirements-and-tech.md](./requirements-and-tech.md) に章立てで記載。
- **参照**: [.cursor/skills/requirements-tech-spec/SKILL.md](../.cursor/skills/requirements-tech-spec/SKILL.md)
- **触ったファイル**: `docs/requirements-and-tech.md`, `docs/tasks.md`, `docs/dev-diary.md`
