"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotImage } from "@/types/spot";
import { deleteSpotImage, spotImageUrl } from "@/lib/api/spotImages";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

/** 受け入れる形式と上限(バックエンドのapp.uploadと揃えること) */
export const MAX_IMAGES = 3;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SpotImagePickerProps {
  /** 登録済みの画像(編集時のみ。投稿画面では空) */
  savedImages: SpotImage[];
  /** これから送信する選択済みファイル */
  selectedFiles: File[];
  onSelectedFilesChange: (files: File[]) => void;
  /** 登録済み画像を削除したとき(親で一覧を取り直す) */
  onSavedImageDeleted: (imageId: number) => void;
  spotId?: number;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function SpotImagePicker({
  savedImages,
  selectedFiles,
  onSelectedFilesChange,
  onSavedImageDeleted,
  spotId,
}: SpotImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpotImage | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // プレビュー用のURLは選択が変わるたびに作り直し、古いものは解放する
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const total = savedImages.length + selectedFiles.length;
  const remaining = MAX_IMAGES - total;

  const handleAdd = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const added: File[] = [];
    let message: string | null = null;
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        message = "JPEG、PNG、WebPのいずれかを選んでください。";
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        message = `1枚あたり${formatSize(MAX_IMAGE_SIZE_BYTES)}までです。`;
        continue;
      }
      if (selectedFiles.length + added.length + savedImages.length >= MAX_IMAGES) {
        message = `画像は${MAX_IMAGES}枚までです。`;
        break;
      }
      added.push(file);
    }
    setError(message);
    if (added.length > 0) {
      onSelectedFilesChange([...selectedFiles, ...added]);
    }
    // 同じファイルを続けて選べるよう入力欄を空にする
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveSelected = (index: number) => {
    onSelectedFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  const handleDeleteSaved = async (image: SpotImage) => {
    if (spotId === undefined) {
      return;
    }
    setError(null);
    setDeletingId(image.id);
    try {
      await deleteSpotImage(spotId, image.id);
      onSavedImageDeleted(image.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "画像を削除できませんでした。");
    } finally {
      setDeleteTarget(null);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <ErrorMessage message={error} />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id="spot-images"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(event) => handleAdd(event.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          画像を選ぶ
        </Button>
        <p className="text-sm text-slate-600">
          {remaining > 0
            ? `あと${remaining}枚選べます(JPEG・PNG・WebP、1枚${formatSize(MAX_IMAGE_SIZE_BYTES)}まで)`
            : `画像は${MAX_IMAGES}枚までです。`}
        </p>
      </div>

      {total > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {savedImages.map((image) => (
            <li key={`saved-${image.id}`} className="space-y-1">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {/* 画像はAPIから配信するためnext/imageは使わない */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotId === undefined ? "" : spotImageUrl(spotId, image.id)}
                  alt={image.originalName}
                  className="aspect-video w-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="w-full"
                loading={deletingId === image.id}
                onClick={() => setDeleteTarget(image)}
              >
                削除
              </Button>
            </li>
          ))}
          {selectedFiles.map((file, index) => (
            <li key={`new-${file.name}-${index}`} className="space-y-1">
              <div className="overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[index] ?? ""}
                  alt={file.name}
                  className="aspect-video w-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleRemoveSelected(index)}
              >
                取り消す
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        自分で撮影した写真を使い、人の顔や表札など個人が特定できるものが写らないようにしてください。
      </p>

      <ConfirmModal
        open={deleteTarget !== null}
        title="画像を削除"
        description={
          deleteTarget
            ? `「${deleteTarget.originalName}」を削除します。この操作は取り消せません。`
            : undefined
        }
        confirmLabel="削除する"
        confirmVariant="danger"
        loading={deleteTarget !== null && deletingId === deleteTarget.id}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDeleteSaved(deleteTarget);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
