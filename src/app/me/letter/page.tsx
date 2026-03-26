"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import {
  setLetterAction,
  type LetterState,
} from "@/app/actions/set-letter";

const initial: LetterState = {};

export default function MeLetterPage() {
  const [state, formAction, pending] = useActionState(setLetterAction, initial);

  useEffect(() => {
    // 列変更後は Server Component のカレンダーが確実に再取得されるようフルナビゲーションする
    if (state.ok) {
      window.location.href = "/calendar";
    }
  }, [state.ok]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">あなたの A〜D</h1>
      <p className="text-sm text-zinc-600">
        会社の割当に合わせて、自分の列を選んでください（最新の版に紐づきます）。
      </p>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-zinc-700">
            列を選択
          </legend>
          {(["A", "B", "C", "D"] as const).map((L) => (
            <label
              key={L}
              className="flex min-h-12 items-center gap-3 rounded-md border border-zinc-300 bg-white px-3"
            >
              <input
                type="radio"
                name="letter"
                value={L}
                required
                className="h-5 w-5"
              />
              <span className="text-lg">{L}</span>
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-md bg-zinc-800 text-base font-medium text-white disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存"}
        </button>
      </form>
      <p>
        <Link href="/calendar" className="text-sm underline">
          シフト一覧へ戻る
        </Link>
      </p>
    </main>
  );
}
