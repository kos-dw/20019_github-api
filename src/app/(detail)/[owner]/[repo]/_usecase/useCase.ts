import { DomainError, RepoStore, Repo, RepoFullName } from "@/app/_shared/github/domain";
import { type Result } from "@/utils/result";

export class GetRepo {
  constructor(private readonly repo: RepoStore) {}

  async execute({ owner, repo }: { owner: string; repo: string }): Promise<Result<Repo, DomainError>> {
    const fullName = RepoFullName.create(owner, repo);
    if (!fullName.ok) return fullName;

    return this.repo.findByFullName(fullName.val);
  }
}
