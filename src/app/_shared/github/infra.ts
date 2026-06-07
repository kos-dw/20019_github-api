import { DEFAULT_PER_PAGE } from "@/config/github";
import { type HttpClientError, GitHubHttpClient } from "@/libs/github/HttpClient";
import { GitHubRepoDto, GitHubSearchReposDto } from "@/libs/github/dto";
import { type Result, err, ok } from "@/utils/result";
import { DomainError, Owner, Repo, RepoFullName, RepoStats, RepoStore, SearchInput, SearchResult } from "./domain";
import { ExternalServiceError, RateLimitExceededError, RepoNotFoundError } from "./errors";

function mapToDomainError(error: HttpClientError): DomainError {
  if (error.kind === "network") {
    return new ExternalServiceError();
  }

  const { status, headers } = error;
  if (status === 404) {
    return new RepoNotFoundError();
  }
  if (status === 403 && headers.get("x-ratelimit-remaining") === "0") {
    return new RateLimitExceededError();
  }

  return new ExternalServiceError();
}

export function toRepo(dto: GitHubRepoDto): Repo {
  const fullNameResult = RepoFullName.create(dto.owner.login, dto.name);
  if (!fullNameResult.ok) {
    throw new Error(
      `[Infrastructure Error] Failed to map GitHub API response to Repo entity: invalid full_name format '${dto.full_name}' received.`
    );
  }
  const fullName = fullNameResult.val;

  return new Repo({
    id: dto.id,
    fullName: fullName,
    owner: new Owner(dto.owner.login, dto.owner.avatar_url),
    stats: new RepoStats({
      stars: dto.stargazers_count,
      watchers: dto.subscribers_count,
      forks: dto.forks_count,
      issues: dto.open_issues_count,
    }),
    language: dto.language,
  });
}

export class GitHubRepoStore implements RepoStore {
  constructor(private readonly http: GitHubHttpClient) {}

  async search(input: SearchInput): Promise<Result<SearchResult, DomainError>> {
    const params = new URLSearchParams({
      q: input.query,
      page: String(input.page),
      per_page: String(DEFAULT_PER_PAGE),
    });
    const res = await this.http.get<GitHubSearchReposDto>(`/search/repositories?${params.toString()}`);
    if (!res.ok) return err(mapToDomainError(res.err));

    return ok({
      items: res.val.body.items.map(toRepo),
      totalCount: res.val.body.total_count,
    });
  }

  async findByFullName(fullName: RepoFullName): Promise<Result<Repo, DomainError>> {
    const res = await this.http.get<GitHubRepoDto>(`/repos/${fullName.value}`);
    if (!res.ok) return err(mapToDomainError(res.err));

    return ok(toRepo(res.val.body));
  }
}
