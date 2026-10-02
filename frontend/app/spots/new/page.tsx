"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { SpotForm } from "@/components/spots/SpotForm";

export default function NewSpotPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/spots/new");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">聖地を投稿</h1>
      <p className="mt-2 text-sm text-slate-600">
        住所から検索して地図上で正確な位置を指定してください。
        {user.role === "USER" &&
          "投稿は管理者の確認後に公開されます。"}
      </p>
      <div className="mt-6">
        <SpotForm mode="create" />
      </div>
    </div>
  );
}
