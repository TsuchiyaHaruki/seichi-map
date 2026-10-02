"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchMyLikes } from "@/lib/api/users";
import { fetchMyFavorites } from "@/lib/api/favorites";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Spinner } from "@/components/ui/Spinner";
import { MyPostsList } from "@/components/mypage/MyPostsList";
import { MySpotList } from "@/components/mypage/MySpotList";

const TABS = [
  { key: "posts", label: "自分の投稿" },
  { key: "likes", label: "いいね" },
  { key: "favorites", label: "お気に入り" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MyPageTabs() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const likesFetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchMyLikes(page, DEFAULT_PAGE_SIZE, signal),
    [],
  );
  const favoritesFetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchMyFavorites(page, DEFAULT_PAGE_SIZE, signal),
    [],
  );

  const focusTab = (index: number) => {
    const next = (index + TABS.length) % TABS.length;
    setActiveTab(TABS[next].key);
    tabRefs.current[next]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(TABS.length - 1);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && (
        <section
          aria-label="ユーザー情報"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-lg font-semibold text-slate-900">
            {user.userName}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            ロール: {user.role === "ADMIN" ? "管理者" : "一般ユーザー"}
          </p>
        </section>
      )}

      <div
        role="tablist"
        aria-label="マイページのタブ"
        className="flex gap-1 border-b border-slate-200"
      >
        {TABS.map((tab, index) => {
          const selected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`mypage-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`mypage-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 rounded-t-md px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                selected
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`mypage-panel-${activeTab}`}
        aria-labelledby={`mypage-tab-${activeTab}`}
      >
        {activeTab === "posts" && <MyPostsList />}
        {activeTab === "likes" && (
          <MySpotList
            fetcher={likesFetcher}
            emptyTitle="いいねした聖地がありません"
            emptyDescription="気になる聖地にいいねしてみましょう。"
          />
        )}
        {activeTab === "favorites" && (
          <MySpotList
            fetcher={favoritesFetcher}
            emptyTitle="お気に入りの聖地がありません"
            emptyDescription="訪れたい聖地をお気に入りに追加してみましょう。"
          />
        )}
      </div>
    </div>
  );
}
