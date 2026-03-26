"use client";

import { useActionState } from "react";
import {
  createEditionAction,
  type EditionState,
} from "@/app/actions/edition";

const initial: EditionState = {};

export function CreateEditionForm() {
  const [state, formAction, pending] = useActionState(
    createEditionAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-medium text-zinc-900">版を追加</h2>
      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">表示名（例: 2025年度）</span>
        <input
          name="label"
          type="text"
          required
          className="min-h-12 rounded-md border border-zinc-300 px-3 text-base"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-md bg-zinc-800 text-base font-medium text-white disabled:opacity-50"
      >
        {pending ? "保存中…" : "作成"}
      </button>
    </form>
  );
}
