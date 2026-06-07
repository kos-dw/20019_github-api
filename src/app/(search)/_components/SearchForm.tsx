"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === "") {
      setValidationError("検索キーワードを入力してください。");
      return;
    }

    setValidationError(null);
    router.push(`/?q=${encodeURIComponent(trimmed)}&page=1`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="search-query" className="sr-only">
          検索キーワード
        </label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="リポジトリ名を入力してください"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
        />
        <button
          type="submit"
          aria-label="検索"
          className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
        >
          検索
        </button>
      </div>
      {validationError && (
        <p role="alert" className="text-sm text-red-600">
          {validationError}
        </p>
      )}
    </form>
  );
}
