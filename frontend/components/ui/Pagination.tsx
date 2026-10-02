"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** 現在ページ(0始まり)を中心に最大5件のページ番号を返す */
function pageNumbers(page: number, totalPages: number): number[] {
  const maxVisible = 5;
  let start = Math.max(0, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible);
  start = Math.max(0, end - maxVisible);
  const numbers: number[] = [];
  for (let i = start; i < end; i++) {
    numbers.push(i);
  }
  return numbers;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const buttonBase =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300";
  return (
    <nav aria-label="ページネーション">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            className={`${buttonBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
            disabled={disabled || page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            前へ
          </button>
        </li>
        {pageNumbers(page, totalPages).map((number) => (
          <li key={number}>
            <button
              type="button"
              aria-label={`${number + 1}ページ目`}
              aria-current={number === page ? "page" : undefined}
              className={`${buttonBase} ${
                number === page
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={disabled}
              onClick={() => onPageChange(number)}
            >
              {number + 1}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={`${buttonBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
            disabled={disabled || page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            次へ
          </button>
        </li>
      </ul>
    </nav>
  );
}
