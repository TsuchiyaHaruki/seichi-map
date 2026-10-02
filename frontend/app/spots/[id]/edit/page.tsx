"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SpotForm } from "@/components/spots/SpotForm";

export default function EditSpotPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const spotId = Number(idParam);
  const validId = Number.isInteger(spotId) && spotId > 0;

  useEffect(() => {
    if (!loading && !user && validId) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/spots/${spotId}/edit`)}`,
      );
    }
  }, [loading, user, validId, spotId, router]);

  if (!validId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorMessage message="指定された聖地が見つかりません。" />
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">聖地を編集</h1>
      <div className="mt-6">
        <SpotForm mode="edit" spotId={spotId} />
      </div>
    </div>
  );
}
