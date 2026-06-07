import { type Result, err, ok } from "@/utils/result";

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class InvalidRepoFullNameError extends DomainError {
  readonly code = "INVALID_REPO_FULL_NAME";
  constructor(message = "invalid owner or repository name") {
    super(message);
  }
}

export class EmptySearchQueryError extends DomainError {
  readonly code = "EMPTY_SEARCH_QUERY";
  constructor(message = "search query must not be empty") {
    super(message);
  }
}

export class InvalidPageError extends DomainError {
  readonly code = "INVALID_PAGE";
  constructor(message = "page number must be a positive integer within the valid range") {
    super(message);
  }
}

export class Owner {
  constructor(
    readonly login: string,
    readonly avatarUrl: string
  ) {
    if (!this.login) {
      throw new Error("login field cannot be empty");
    }
  }
}

export class RepoFullName {
  private constructor(
    private readonly _owner: string,
    private readonly _repo: string
  ) {}

  static create(rawOwner: string, rawRepo: string): Result<RepoFullName, InvalidRepoFullNameError> {
    const owner = rawOwner.trim();
    const repo = rawRepo.trim();
    if (owner === "" || repo === "") return err(new InvalidRepoFullNameError());

    const repoFullName = new RepoFullName(owner, repo);
    return ok(repoFullName);
  }

  get value(): string {
    return `${this._owner}/${this._repo}`;
  }

  get owner(): string {
    return this._owner;
  }

  get repo(): string {
    return this._repo;
  }
}

export type RepoStatsParams = {
  stars: number;
  watchers: number;
  forks: number;
  issues: number;
};

export class RepoStats {
  readonly stars: number;
  readonly watchers: number;
  readonly forks: number;
  readonly issues: number;

  constructor(param: RepoStatsParams) {
    this.stars = param.stars;
    this.watchers = param.watchers;
    this.forks = param.forks;
    this.issues = param.issues;
  }
}

export type RepoParams = {
  id: number;
  fullName: RepoFullName;
  owner: Owner;
  stats: RepoStats;
  language: string | null;
};

export class Repo {
  readonly id;
  readonly fullName;
  readonly owner;
  readonly stats;
  readonly language;

  constructor(param: RepoParams) {
    this.id = param.id;
    this.fullName = param.fullName;
    this.owner = param.owner;
    this.stats = param.stats;
    this.language = param.language;
  }

  equals(repo: Repo) {
    return this.id === repo.id;
  }
}

export type SearchResult = { items: Repo[]; totalCount: number };
export type SearchInput = { query: string; page: number };

export interface RepoStore {
  search(input: SearchInput): Promise<Result<SearchResult, DomainError>>;
  findByFullName(fullName: RepoFullName): Promise<Result<Repo, DomainError>>;
}
