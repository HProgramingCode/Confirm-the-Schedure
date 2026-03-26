---
name: personal-dev-efficiency
description: >-
  個人開発向けに Rules / Skills の重複整理・運用の見通しを付ける。
  「ルール整備」「スキル整理」「重複を減らしたい」「個人開発を速くしたい」と言われたらこのスキルを読み、
  実作業は Cursor 同梱の create-rule / create-skill / skill-creator に委譲する。
---

# 個人開発：Rules / Skills の整理（索引）

## まず読むもの（重複を避ける）

1. **常時ルール** `cursor-builtin-skills.mdc` … Cursor 同梱スキル（Settings の Skills に相当）の**フルパス一覧**と用途。
2. 具体的な作業ごとに **同梱 SKILL を Read**（このファイルに詳細手順は書かない）。

| やりたいこと | 委譲先（Read するパス） |
|--------------|-------------------------|
| `.mdc` ルールを書く・直す | `$HOME/.cursor/skills-cursor/create-rule/SKILL.md` |
| 新しい自作スキルの型・配置 | `$HOME/.cursor/skills-cursor/create-skill/SKILL.md` |
| eval・benchmark・説明文の改善ループ | `$HOME/.cursor/skills-cursor/skill-creator/SKILL.md` |
| サブエージェント | `$HOME/.cursor/skills-cursor/create-subagent/SKILL.md` |

## このスキルでやること（短く）

- いまのルール／スキル／User Rules の**重複・矛盾**を指摘する。
- **1 関心 1 ファイル**に寄せる提案をする（詳細フォーマットは **create-rule** に任せる）。
- 自作スキルをリポに揃える手順: ターミナル **`setup-cursor`**。

## 置かないもの

- `~/.cursor/skills-cursor/` への自作追加（Cursor 管理領域）。
- create-skill / create-rule と同じ長文手順の複製。
