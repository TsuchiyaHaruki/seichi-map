"use client";

import Link from "next/link";
import { useState } from "react";
import { register } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateRegisterForm, type ValidationErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export function RegisterForm() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setFormError(null);

    const values = { userName, email, password, passwordConfirmation };
    const errors = validateRegisterForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        userName: userName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation,
      });
      setRegistered(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "EMAIL_ALREADY_EXISTS") {
          setFieldErrors({
            email: "このメールアドレスは既に登録されています。",
          });
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
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-4"
        >
          <p className="text-sm font-bold text-green-800">
            ユーザー登録が完了しました
          </p>
          <p className="mt-1 text-sm text-green-800">
            登録したメールアドレスとパスワードでログインしてください。
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          ログイン画面へ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={formError} />
      <Input
        label="ユーザー名"
        name="userName"
        type="text"
        autoComplete="username"
        value={userName}
        onChange={(event) => setUserName(event.target.value)}
        error={fieldErrors.userName}
        required
      />
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
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        required
      />
      <Input
        label="確認用パスワード"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        value={passwordConfirmation}
        onChange={(event) => setPasswordConfirmation(event.target.value)}
        error={fieldErrors.passwordConfirmation}
        required
      />
      <Button type="submit" loading={submitting} className="w-full">
        登録する
      </Button>
      <p className="text-center text-sm text-slate-600">
        既にアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 underline hover:text-indigo-700"
        >
          ログイン
        </Link>
      </p>
    </form>
  );
}
