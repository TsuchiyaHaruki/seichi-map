"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function Header() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // ログアウト失敗時もローカル状態は再取得する
    } finally {
      await refresh();
      setLoggingOut(false);
      setConfirmOpen(false);
      closeMenu();
      router.push("/");
    }
  };

  const linkClass =
    "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
  const primaryLinkClass =
    "inline-flex min-h-11 items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

  const navItems = (
    <>
      <Link href="/spots/new" className={primaryLinkClass} onClick={closeMenu}>
        聖地を投稿
      </Link>
      {loading ? null : user ? (
        <>
          <span className="px-3 py-2 text-sm text-slate-600">
            {user.userName}さん
          </span>
          <Link href="/mypage" className={linkClass} onClick={closeMenu}>
            マイページ
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" className={linkClass} onClick={closeMenu}>
              管理者
            </Link>
          )}
          <button
            type="button"
            className={`${linkClass} disabled:cursor-not-allowed disabled:text-slate-400`}
            onClick={() => setConfirmOpen(true)}
            disabled={loggingOut}
          >
            ログアウト
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={linkClass} onClick={closeMenu}>
            ログイン
          </Link>
          <Link href="/register" className={linkClass} onClick={closeMenu}>
            新規登録
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-base font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:text-lg"
          onClick={closeMenu}
        >
          ノベルゲーム聖地巡礼マップ
        </Link>
        <nav aria-label="メインメニュー" className="hidden items-center gap-1 md:flex">
          {navItems}
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="メニュー"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="メインメニュー"
          className="border-t border-slate-200 md:hidden"
        >
          <div className="flex flex-col items-stretch gap-1 px-4 py-3 [&>*]:justify-start">
            {navItems}
          </div>
        </nav>
      )}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        titleId="logout-confirm-title"
        widthClassName="max-w-sm"
      >
        <h2
          id="logout-confirm-title"
          className="text-lg font-bold text-slate-900"
        >
          ログアウト
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          ログアウトします。続けて利用するには再度ログインが必要です。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={loggingOut}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            loading={loggingOut}
            onClick={() => void handleLogout()}
          >
            ログアウトする
          </Button>
        </div>
      </Modal>
    </header>
  );
}
