"use client";

import { useEffect, useState } from "react";
import type { Category, RegistrantType } from "@/types/spot";
import {
  CATEGORY_OPTIONS,
  PREFECTURES,
  REGISTRANT_TYPE_OPTIONS,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface SearchFormValues {
  keyword: string;
  category: Category | "";
  prefecture: string;
  registrantType: RegistrantType | "";
}

interface SearchFormProps {
  values: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
  searching?: boolean;
}

export function SearchForm({ values, onSearch, searching }: SearchFormProps) {
  const [draft, setDraft] = useState<SearchFormValues>(values);

  // ブラウザの戻る・進む等でURLの検索条件が変わったらフォームへ反映する
  useEffect(() => {
    setDraft(values);
  }, [values]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch({ ...draft, keyword: draft.keyword.trim() });
  };

  const handleClear = () => {
    const cleared: SearchFormValues = {
      keyword: "",
      category: "",
      prefecture: "",
      registrantType: "",
    };
    setDraft(cleared);
    onSearch(cleared);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4"
      aria-label="聖地検索"
    >
      <div className="flex flex-col gap-3">
        <Input
          label="キーワード"
          name="keyword"
          type="search"
          placeholder="作品名・聖地名・住所など"
          value={draft.keyword}
          onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="カテゴリー"
            name="category"
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as Category | "" })
            }
          >
            <option value="">すべて</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="都道府県"
            name="prefecture"
            value={draft.prefecture}
            onChange={(e) => setDraft({ ...draft, prefecture: e.target.value })}
          >
            <option value="">すべて</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </Select>
          <Select
            label="信頼性区分"
            name="registrantType"
            value={draft.registrantType}
            onChange={(e) =>
              setDraft({
                ...draft,
                registrantType: e.target.value as RegistrantType | "",
              })
            }
          >
            <option value="">すべて</option>
            {REGISTRANT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={searching}
          >
            検索
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClear}
            disabled={searching}
          >
            条件をクリア
          </Button>
        </div>
      </div>
    </form>
  );
}
