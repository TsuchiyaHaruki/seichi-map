import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "ログイン | ノベルゲーム聖地巡礼マップ",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">ログイン</h1>
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
