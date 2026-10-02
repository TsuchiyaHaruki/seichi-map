"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { login } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateLoginForm, type ValidationErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

/** オープンリダイレクト防止: サイト内パスのみ許可する */
function safeRedirectPath(redirect: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setFormError(null);
    setLocked(false);

    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      await refresh();
      router.push(safeRedirectPath(searchParams.get("redirect")));
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "ACCOUNT_LOCKED") {
          setLocked(true);
        } else if (
          error.code === "VALIDATION_ERROR" &&
          Object.keys(error.errors).length > 0
        ) {
          setFieldErrors(error.errors);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("エラーが発生しました。時間をおいて再度お試しください。");
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {locked && (
        <div
          role="alert"
          className="rounded-md border border-yellow-400 bg-yellow-50 p-4"
        >
          <p className="text-sm font-bold text-yellow-800">
            アカウントがロックされています
          </p>
          <p className="mt-1 text-sm text-yellow-800">
            ログインに一定回数失敗したため、アカウントがロックされています。管理者にお問い合わせください。
          </p>
        </div>
      )}
      <ErrorMessage message={formError} />
      <Input
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        required
      />
      <Input
        label="パスワード"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        required
      />
      <Button type="submit" loading={submitting} className="w-full">
        ログイン
      </Button>
      <p className="text-center text-sm text-slate-600">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 underline hover:text-indigo-700"
        >
          新規登録
        </Link>
      </p>
    </form>
  );
}
