import { Repo } from "@/app/_shared/github/domain";
import { RepoListItem } from "./RepoListItem";

type RepoListProps = {
  items: Repo[];
  query: string;
  page: number;
};

export function RepoList({ items, query, page }: RepoListProps) {
  return (
    <ul className="divide-y divide-zinc-200 rounded border border-zinc-200">
      {items.map((repo) => (
        <RepoListItem key={repo.id} repo={repo} query={query} page={page} />
      ))}
    </ul>
  );
}
