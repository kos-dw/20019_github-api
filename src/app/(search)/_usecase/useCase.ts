import { DomainError, RepoStore, SearchResult } from "@/app/_shared/github/domain";
import { type Result } from "@/utils/result";
import { Page, SearchQuery } from "./searchVo";

export class SearchRepos {
  constructor(private readonly repo: RepoStore) {}

  async execute({ query, page }: { query: string; page: number }): Promise<Result<SearchResult, DomainError>> {
    const q = SearchQuery.create(query);
    if (!q.ok) return q;

    const p = Page.create(page);
    if (!p.ok) return p;

    return this.repo.search({ query: q.val.value, page: p.val.value });
  }
}
