import { Suspense } from "react";
import { SpotExplorer } from "@/components/spots/SpotExplorer";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">読み込み中...</div>
      }
    >
      <SpotExplorer />
    </Suspense>
  );
}
