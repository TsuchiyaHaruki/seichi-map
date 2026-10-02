"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, SpotDetail, SpotImage, SpotRequest } from "@/types/spot";
import type { LatLng } from "@/lib/maps/distance";
import { ApiError } from "@/lib/api/client";
import {
  createSpot,
  fetchSpotDetail,
  updateSpot,
} from "@/lib/api/spots";
import { fetchAdminSpotDetail, updateSpotAsAdmin } from "@/lib/api/admin";
import { fetchSpotImages, uploadSpotImage } from "@/lib/api/spotImages";
import { SpotImagePicker } from "@/components/spots/SpotImagePicker";
import { validateSpotForm, type ValidationErrors } from "@/lib/validation";
import { CATEGORY_OPTIONS, PREFECTURES } from "@/lib/constants";
import {
  LocationPicker,
  type LocationPickerHandle,
} from "@/components/map/LocationPicker";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface SpotFormProps {
  mode: "create" | "edit";
  spotId?: number;
  admin?: boolean;
}

interface FormValues {
  workName: string;
  spotName: string;
  category: Category | "";
  address: string;
  prefecture: string;
  latitude: string;
  longitude: string;
  sceneDescription: string;
  description: string;
  sourceUrl: string;
  sourceDescription: string;
}

const EMPTY_VALUES: FormValues = {
  workName: "",
  spotName: "",
  category: "",
  address: "",
  prefecture: "",
  latitude: "",
  longitude: "",
  sceneDescription: "",
  description: "",
  sourceUrl: "",
  sourceDescription: "",
};

function detailToValues(detail: SpotDetail): FormValues {
  return {
    workName: detail.workName,
    spotName: detail.spotName,
    category: detail.category,
    address: detail.address,
    prefecture: detail.prefecture ?? "",
    latitude: String(detail.latitude),
    longitude: String(detail.longitude),
    sceneDescription: detail.sceneDescription ?? "",
    description: detail.description ?? "",
    sourceUrl: detail.sourceUrl ?? "",
    sourceDescription: detail.sourceDescription ?? "",
  };
}

function parseCoordinate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return Number.NaN;
  }
  return Number(trimmed);
}

function optionalText(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed ? trimmed : undefined;
}

export function SpotForm({ mode, spotId, admin = false }: SpotFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const pickerRef = useRef<LocationPickerHandle | null>(null);
  const googlePlaceIdRef = useRef<string | undefined>(undefined);

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<SpotImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    mode === "edit" ? "loading" : "ready",
  );

  const setField = (name: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const loadDetail = useCallback(async () => {
    if (mode !== "edit" || spotId === undefined) {
      return;
    }
    setLoadState("loading");
    try {
      const detail = admin
        ? await fetchAdminSpotDetail(spotId)
        : await fetchSpotDetail(spotId);
      googlePlaceIdRef.current = detail.googlePlaceId ?? undefined;
      setValues(detailToValues(detail));
      setSavedImages(await fetchSpotImages(spotId));
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [mode, spotId, admin]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const latitude = parseCoordinate(values.latitude);
  const longitude = parseCoordinate(values.longitude);
  const position: LatLng | null =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : null;

  const handlePickerChange = (
    pos: LatLng,
    resolvedAddress?: string,
    prefecture?: string,
  ) => {
    setValues((prev) => ({
      ...prev,
      latitude: pos.lat.toFixed(6),
      longitude: pos.lng.toFixed(6),
      prefecture:
        prefecture && PREFECTURES.includes(prefecture)
          ? prefecture
          : prev.prefecture,
    }));
    setSuggestedAddress(resolvedAddress ?? null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      return next;
    });
  };

  const handleSearch = async () => {
    if (searching) {
      return;
    }
    if (!values.address.trim()) {
      setErrors((prev) => ({
        ...prev,
        address: "住所を入力してから検索してください。",
      }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      return next;
    });
    setSearching(true);
    try {
      await pickerRef.current?.searchAddress(values.address);
    } finally {
      setSearching(false);
    }
  };

  /**
   * 選択した画像を順に送信する。1枚でも失敗したらtrueを返す。
   * 聖地本体の登録は済んでいるため、画像の失敗で全体を巻き戻すことはしない。
   */
  const uploadSelectedImages = async (targetSpotId: number): Promise<boolean> => {
    let failed = false;
    for (const file of selectedImages) {
      try {
        await uploadSpotImage(targetSpotId, file);
      } catch {
        failed = true;
      }
    }
    return failed;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const request: SpotRequest = {
      workName: values.workName.trim(),
      spotName: values.spotName.trim(),
      category: values.category as Category,
      address: values.address.trim(),
      prefecture: optionalText(values.prefecture),
      latitude: parseCoordinate(values.latitude),
      longitude: parseCoordinate(values.longitude),
      sceneDescription: optionalText(values.sceneDescription),
      description: optionalText(values.description),
      sourceUrl: optionalText(values.sourceUrl),
      sourceDescription: optionalText(values.sourceDescription),
      googlePlaceId: googlePlaceIdRef.current,
    };
    const validationErrors = validateSpotForm(request);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) {
      setFormError("入力内容を確認してください。");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await createSpot(request);
        const imageFailed = await uploadSelectedImages(created.id);
        const notice =
          user?.role === "ADMIN"
            ? "聖地を登録しました。"
            : "投稿しました。管理者の確認後に公開されます。";
        router.push(
          `/?notice=${encodeURIComponent(
            imageFailed ? `${notice}(一部の画像は保存できませんでした)` : notice,
          )}`,
        );
      } else if (spotId !== undefined) {
        if (admin) {
          await updateSpotAsAdmin(spotId, request);
        } else {
          await updateSpot(spotId, request);
        }
        const imageFailed = await uploadSelectedImages(spotId);
        if (imageFailed) {
          setFormError("一部の画像を保存できませんでした。もう一度お試しください。");
          setSavedImages(await fetchSpotImages(spotId));
          setSelectedImages([]);
          setSubmitting(false);
          return;
        }
        router.push(admin ? "/admin/spots" : "/mypage");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.errors).length > 0) {
          setErrors(error.errors);
        }
        setFormError(error.message);
      } else {
        setFormError("エラーが発生しました。時間をおいて再度お試しください。");
      }
      setSubmitting(false);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <ErrorMessage
        message="聖地情報を読み込めませんでした。"
        onRetry={() => void loadDetail()}
      />
    );
  }

  const showResubmitNote = mode === "edit" && !admin && user?.role === "USER";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      // 作品・聖地の情報欄に利用者の氏名・住所などがオートフィルされないよう無効化する
      autoComplete="off"
      className="space-y-8"
    >
      {showResubmitNote && (
        <div
          role="note"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
        >
          編集すると再度確認待ちになります。管理者の確認が完了するまで公開されません。
        </div>
      )}

      <section aria-labelledby="spot-form-basic" className="space-y-4">
        <h2
          id="spot-form-basic"
          className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900"
        >
          基本情報
        </h2>
        <Input
          label="作品名"
          name="workName"
          autoComplete="off"
          required
          maxLength={100}
          value={values.workName}
          error={errors.workName}
          onChange={(e) => setField("workName", e.target.value)}
        />
        <Input
          label="聖地名"
          name="spotName"
          autoComplete="off"
          required
          maxLength={100}
          value={values.spotName}
          error={errors.spotName}
          onChange={(e) => setField("spotName", e.target.value)}
        />
        <Select
          label="カテゴリー"
          name="category"
          autoComplete="off"
          required
          value={values.category}
          error={errors.category}
          onChange={(e) => setField("category", e.target.value)}
        >
          <option value="">選択してください</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </section>

      <section aria-labelledby="spot-form-location" className="space-y-4">
        <h2
          id="spot-form-location"
          className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900"
        >
          位置情報
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="住所"
              name="address"
              autoComplete="off"
              required
              maxLength={255}
              value={values.address}
              error={errors.address}
              // 「住所から検索」ボタンと下端を揃えたままにするため上に表示する
              errorPlacement="above"
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            loading={searching}
            onClick={() => void handleSearch()}
          >
            住所から検索
          </Button>
        </div>
        {suggestedAddress && suggestedAddress !== values.address && (
          <div className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">
              検索結果の住所: {suggestedAddress}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setField("address", suggestedAddress);
                setSuggestedAddress(null);
              }}
            >
              住所欄に反映
            </Button>
          </div>
        )}
        <LocationPicker
          ref={pickerRef}
          value={position}
          onChange={handlePickerChange}
        />
        <Select
          label="都道府県"
          name="prefecture"
          autoComplete="off"
          value={values.prefecture}
          error={errors.prefecture}
          onChange={(e) => setField("prefecture", e.target.value)}
        >
          <option value="">選択してください</option>
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture} value={prefecture}>
              {prefecture}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="緯度"
            name="latitude"
            autoComplete="off"
            required
            inputMode="decimal"
            placeholder="例: 35.122500"
            value={values.latitude}
            error={errors.latitude}
            onChange={(e) => setField("latitude", e.target.value)}
          />
          <Input
            label="経度"
            name="longitude"
            autoComplete="off"
            required
            inputMode="decimal"
            placeholder="例: 136.947800"
            value={values.longitude}
            error={errors.longitude}
            onChange={(e) => setField("longitude", e.target.value)}
          />
        </div>
        <p className="text-xs text-slate-600">
          緯度・経度は地図の操作で自動入力されます。必要な場合は手動で修正できます。
        </p>
      </section>

      <section aria-labelledby="spot-form-images" className="space-y-4">
        <h2
          id="spot-form-images"
          className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900"
        >
          画像(任意)
        </h2>
        <SpotImagePicker
          spotId={spotId}
          savedImages={savedImages}
          selectedFiles={selectedImages}
          onSelectedFilesChange={setSelectedImages}
          onSavedImageDeleted={(imageId) =>
            setSavedImages((prev) => prev.filter((image) => image.id !== imageId))
          }
        />
      </section>

      <section aria-labelledby="spot-form-detail" className="space-y-4">
        <h2
          id="spot-form-detail"
          className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900"
        >
          詳細情報(任意)
        </h2>
        <TextArea
          label="登場場面"
          name="sceneDescription"
          rows={3}
          maxLength={500}
          value={values.sceneDescription}
          error={errors.sceneDescription}
          onChange={(e) => setField("sceneDescription", e.target.value)}
        />
        <TextArea
          label="説明"
          name="description"
          rows={5}
          maxLength={5000}
          value={values.description}
          error={errors.description}
          onChange={(e) => setField("description", e.target.value)}
        />
        <Input
          label="出典URL"
          name="sourceUrl"
          type="url"
          autoComplete="off"
          maxLength={500}
          placeholder="https://example.com"
          value={values.sourceUrl}
          error={errors.sourceUrl}
          onChange={(e) => setField("sourceUrl", e.target.value)}
        />
        <TextArea
          label="出典説明"
          name="sourceDescription"
          rows={3}
          maxLength={500}
          value={values.sourceDescription}
          error={errors.sourceDescription}
          onChange={(e) => setField("sourceDescription", e.target.value)}
        />
      </section>

      {formError && <ErrorMessage message={formError} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" loading={submitting}>
          {mode === "create" ? "投稿する" : "更新する"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
