"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [err, setErr] = useState("");
  const sp = useSearchParams();
  const registered = sp.get("registered");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/calendar",
    });
    if (res?.error) {
      setErr("メールまたはパスワードが正しくありません。");
      return;
    }
    if (res?.url) {
      // redirect: false のあとセッションをアプリ全体に反映させるためフルページ遷移にする
      window.location.href = res.url;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">ログイン</h1>
      {registered ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-900">
          登録が完了しました。ログインしてください。
        </p>
      ) : null}
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          {err}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <span className="text-sm font-medium text-zinc-700">パスワード</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-12 rounded-md border border-zinc-300 bg-white px-3 text-base"
          />
        </label>
        <button
          type="submit"
          className="min-h-12 rounded-md bg-zinc-800 text-base font-medium text-white"
        >
          ログイン
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600">
        <Link href="/register" className="underline">
          新規登録
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-4 text-center">読み込み中…</p>}>
      <LoginForm />
    </Suspense>
  );
}
