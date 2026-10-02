import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "新規登録 | ノベルゲーム聖地巡礼マップ",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">新規登録</h1>
      <RegisterForm />
    </div>
  );
}
