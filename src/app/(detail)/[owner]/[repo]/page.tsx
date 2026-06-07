import { RepoNotFoundError } from "@/app/_shared/github/errors";
import { GitHubRepoStore } from "@/app/_shared/github/infra";
import { env } from "@/config/env";
import { GITHUB_API_BASE_URL } from "@/config/github";
import { GitHubHttpClient } from "@/libs/github/HttpClient";
import { notFound } from "next/navigation";
import { DetailPage } from "./_components/DetailPage";
import { GetRepo } from "./_usecase/useCase";

type DetailPageRouteProps = {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function DetailPageRoute({ params, searchParams }: DetailPageRouteProps) {
  const { owner, repo } = await params;
  const { q, page } = await searchParams;

  // 一覧から引き継いだ検索状態を戻り先 href に復元する。直リンク流入時（q なし）はトップへ。
  const backHref = q ? `/?q=${encodeURIComponent(q)}&page=${page ?? "1"}` : "/";

  const http = new GitHubHttpClient(GITHUB_API_BASE_URL, () => env.githubToken);
  const store = new GitHubRepoStore(http);
  const getRepo = new GetRepo(store);

  const result = await getRepo.execute({ owner, repo });

  if (!result.ok) {
    if (result.err instanceof RepoNotFoundError) notFound();
    throw result.err;
  }

  return (
    <section className="container mx-auto p-4">
      <DetailPage repo={result.val} backHref={backHref} />
    </section>
  );
}
