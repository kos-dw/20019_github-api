import Link from "next/link";
import { DEFAULT_PER_PAGE, SEARCH_RESULT_HARD_LIMIT } from "@/config/github";

type PaginationProps = {
  currentPage: number;
  totalCount: number;
  query: string;
};

const MAX_PAGE_BY_LIMIT = Math.floor(SEARCH_RESULT_HARD_LIMIT / DEFAULT_PER_PAGE);
const linkClassName =
  "rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1";
const disabledClassName = "rounded border border-zinc-300 px-3 py-1 opacity-50 cursor-not-allowed";

function buildPageHref(query: string, page: number): string {
  return `/?q=${encodeURIComponent(query)}&page=${page}`;
}

export function Pagination({ currentPage, totalCount, query }: PaginationProps) {
  const maxPage = Math.min(Math.max(1, Math.ceil(totalCount / DEFAULT_PER_PAGE)), MAX_PAGE_BY_LIMIT);

  if (maxPage <= 1) return null;

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= maxPage;

  return (
    <nav aria-label="ページネーション" className="mt-6 flex items-center justify-center gap-4">
      {isFirstPage ? (
        <span aria-disabled="true" className={disabledClassName}>
          前へ
        </span>
      ) : (
        <Link href={buildPageHref(query, currentPage - 1)} className={linkClassName}>
          前へ
        </Link>
      )}
      <span>
        {currentPage} / {maxPage}
      </span>
      {isLastPage ? (
        <span aria-disabled="true" className={disabledClassName}>
          次へ
        </span>
      ) : (
        <Link href={buildPageHref(query, currentPage + 1)} className={linkClassName}>
          次へ
        </Link>
      )}
    </nav>
  );
}
