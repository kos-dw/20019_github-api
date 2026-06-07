import { GitHubRepoStore } from "@/app/_shared/github/infra";
import { env } from "@/config/env";
import { GITHUB_API_BASE_URL } from "@/config/github";
import { GitHubHttpClient } from "@/libs/github/HttpClient";
import { Suspense } from "react";
import { Pagination } from "./_components/Pagination";
import { RepoList } from "./_components/RepoList";
import { SearchForm } from "./_components/SearchForm";
import { SearchRepos } from "./_usecase/useCase";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const page = Number(params.page ?? "1");

  return (
    <>
      <section className="container mx-auto p-4">
        <Suspense fallback={<p className="mb-6 text-zinc-500">フォームを読み込み中...</p>}>
          <SearchForm />
        </Suspense>
      </section>

      <section className="container mx-auto p-4">
        <SearchResults query={query} page={page} />
      </section>
    </>
  );
}

export async function SearchResults({ query, page }: { query: string; page: number }) {
  if (query === "") {
    return <p className="text-zinc-600">キーワードを入力して検索してください</p>;
  }

  const http = new GitHubHttpClient(GITHUB_API_BASE_URL, () => env.githubToken);
  const store = new GitHubRepoStore(http);
  const searchRepos = new SearchRepos(store);
  const result = await searchRepos.execute({ query, page });

  if (!result.ok) throw result.err;

  const { items, totalCount } = result.val;

  if (items.length === 0) {
    return <p className="text-zinc-600">該当するリポジトリが見つかりませんでした</p>;
  }

  return (
    <>
      <RepoList items={items} query={query} page={page} />
      <Pagination currentPage={page} totalCount={totalCount} query={query} />
    </>
  );
}
