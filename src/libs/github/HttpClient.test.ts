import { DEFAULT_REVALIDATE_SECONDS } from "@/config/github";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { GitHubHttpClient } from "./HttpClient";

type JsonType = { total_count: number; items: unknown[] };
const DUMMY_URL = "https://dummy-api.com";
const DUMMY_PATH = "/search/repositories";

describe("GitHubHttpClient（HTTPクライアント）", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("APIが200 OKを返したとき、成功ステータスとレスポンスデータを返すこと", async () => {
    // Arrange
    const expectedStatus = 200;
    const expectedBody = { total_count: 1, items: [] };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: expectedStatus,
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve(expectedBody),
      })
    );
    const client = new GitHubHttpClient(DUMMY_URL);

    // Act
    const result = await client.get<JsonType>(DUMMY_PATH);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.status).toBe(expectedStatus);
    expect(result.val.body).toEqual(expectedBody);
  });

  it("fetchが例外をスローしたとき、ネットワークエラー（kind: 'network'）を返すこと", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));
    const client = new GitHubHttpClient(DUMMY_URL);

    // Act
    const result = await client.get(DUMMY_PATH);

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toEqual({ kind: "network" });
  });

  it("APIが4xxなどのエラーを返したとき、HTTPエラー（kind: 'http'）とステータスコードを返すこと", async () => {
    // Arrange
    const errorStatus = 404;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: errorStatus,
        ok: false,
        headers: new Headers(),
      })
    );
    const client = new GitHubHttpClient(DUMMY_URL);

    // Act
    const result = await client.get(DUMMY_PATH);

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toEqual({
      kind: "http",
      status: errorStatus,
      headers: expect.any(Headers),
    });
  });

  it("リクエスト時に、Next.jsのキャッシュを有効にするためのrevalidateオプションが設定されていること", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ total_count: 1, items: [] }),
      })
    );
    const mockedFetch = vi.mocked(fetch);
    const client = new GitHubHttpClient(DUMMY_URL);

    // Act
    await client.get(DUMMY_PATH);

    // Assert
    const [, calledOptions] = mockedFetch.mock.calls[0];
    expect(calledOptions).toEqual(
      expect.objectContaining({
        next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
      })
    );
  });
});
