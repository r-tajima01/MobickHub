"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/daily";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-black/10 rounded-lg p-6 space-y-4"
    >
      <h1 className="text-lg font-medium">ログイン</h1>

      <div>
        <label className="text-xs text-muted block mb-1">メールアドレス</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-9 px-3 border border-black/15 rounded-md text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs text-muted block mb-1">パスワード</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-9 px-3 border border-black/15 rounded-md text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {error && (
        <div className="text-xs text-bad bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-9 bg-ink text-white text-sm rounded-md hover:bg-black/80 disabled:opacity-50"
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      <p className="text-xs text-muted text-center pt-2">
        アカウントは管理者がSupabaseで作成します
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white font-semibold">
            SF
          </div>
          <div>
            <div className="font-semibold text-base">SalesField</div>
            <div className="text-xs text-muted">MobickHub / 営業実績管理</div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="bg-white border border-black/10 rounded-lg p-6 text-sm text-muted">
              読み込み中...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
