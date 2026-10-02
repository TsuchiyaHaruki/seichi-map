"use client";

import { useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  /** 補足説明(取り消せない操作はその旨を書く) */
  description?: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  /** 実行中はボタンを回転表示にし、閉じる操作を止める */
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** ブラウザ標準のconfirmの代わりに使う共通の確認モーダル */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const titleId = useId();
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      titleId={titleId}
      widthClassName="max-w-md"
    >
      <h2 id={titleId} className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          variant={confirmVariant}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
