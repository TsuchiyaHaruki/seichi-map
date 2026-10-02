import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

afterEach(cleanup);

function renderModal(open = true, onClose = vi.fn()) {
  render(
    <Modal open={open} onClose={onClose} titleId="test-title">
      <h2 id="test-title">タイトル</h2>
      <button type="button">中のボタン</button>
    </Modal>,
  );
  return onClose;
}

describe("Modal(アクセシビリティ)", () => {
  it("openがfalseなら描画されない", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("role=dialog / aria-modal / aria-labelledby を持つ", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "test-title");
  });

  it("Escapeキーで閉じる", () => {
    const onClose = renderModal();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("閉じるボタンで閉じる", () => {
    const onClose = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("表示中は背景スクロールを停止する", () => {
    renderModal();
    expect(document.body.style.overflow).toBe("hidden");
  });
});
