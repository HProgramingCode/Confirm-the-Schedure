"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  registerAction,
  type RegisterState,
} from "@/app/actions/register";

const initial: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">新規登録</h1>
      <p className="text-sm text-zinc-600">
        初回登録のユーザーは自動的に管理者になります（版・シフトの登録用）。
      </p>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">本名（フルネーム）</span>
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            required
            className="min-h-12 rounded-md border border-zinc-300 bg-white px-3 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">メール</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-12 rounded-md border border-zinc-300 bg-white px-3 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">
            パスワード（8文字以上）
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="min-h-12 rounded-md border border-zinc-300 bg-white px-3 text-base"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-md bg-zinc-800 text-base font-medium text-white disabled:opacity-50"
        >
          {pending ? "送信中…" : "登録"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600">
        <Link href="/login" className="underline">
          ログインへ
        </Link>
      </p>
    </main>
  );
}
