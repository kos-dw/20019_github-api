import { DEFAULT_REVALIDATE_SECONDS, GITHUB_API_VERSION } from "@/config/github";
import { type Result, err, ok } from "@/utils/result";

export type HttpClientError = { kind: "network" } | { kind: "http"; status: number; headers: Headers };

export class GitHubHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider?: () => string | undefined
  ) {}

  async get<T>(path: string): Promise<Result<{ status: number; body: T }, HttpClientError>> {
    const token = this.tokenProvider?.();
    const headers = new Headers({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    });

    // トークンなしは非認証アクセス
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = new URL(path, this.baseUrl);
    let res: Response;
    try {
      res = await fetch(url, { headers, next: { revalidate: DEFAULT_REVALIDATE_SECONDS } });
    } catch {
      return err({ kind: "network" });
    }

    if (!res.ok) {
      return err({ kind: "http", status: res.status, headers: res.headers });
    }

    return ok({ status: res.status, body: await res.json() });
  }
}
