import { Repo } from "@/app/_shared/github/domain";
import Image from "next/image";
import Link from "next/link";

type RepoListItemProps = {
  repo: Repo;
  query: string;
  page: number;
};

export function RepoListItem({ repo, query, page }: RepoListItemProps) {
  const { owner, repo: repoName } = repo.fullName;
  // 詳細ページに「直前の検索状態」を引き継ぎ、戻る導線で再現できるようにする。
  const params = new URLSearchParams({ q: query, page: String(page) });
  const href = `/${owner}/${repoName}?${params.toString()}`;

  return (
    <li className="border-b border-zinc-200 p-3 last:border-b-0">
      <Link
        href={href}
        className="flex items-center gap-3 rounded hover:opacity-80 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        <Image src={repo.owner.avatarUrl} alt={`${owner}のアバター`} width={32} height={32} className="rounded-full" />
        <div className="break-all">{repo.fullName.value}</div>
      </Link>
    </li>
  );
}
