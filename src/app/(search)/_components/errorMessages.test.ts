import { describe, expect, it } from "vitest";
import { EmptySearchQueryError, InvalidPageError } from "@/app/_shared/github/domain";
import { ExternalServiceError, RateLimitExceededError } from "@/app/_shared/github/errors";
import { getErrorMessage, shouldShowRetry } from "./errorMessages";

describe("getErrorMessage", () => {
  it.each([
    { error: new EmptySearchQueryError(), expected: "検索キーワードを入力してください。" },
    { error: new InvalidPageError(), expected: "指定されたページが不正です。" },
    {
      error: new RateLimitExceededError(),
      expected: "アクセス上限に達しました。しばらく待ってから再試行してください。",
    },
    {
      error: new ExternalServiceError(),
      expected: "サーバーエラーが発生しました。時間をおいて再試行してください。",
    },
  ])("$error.name のとき対応する日本語メッセージを返すこと", ({ error, expected }) => {
    // Act
    const message = getErrorMessage(error);

    // Assert
    expect(message).toBe(expected);
  });

  it("未知のエラーのときフォールバックメッセージを返すこと", () => {
    // Act
    const message = getErrorMessage(new Error("unknown"));

    // Assert
    expect(message).toBe("予期しないエラーが発生しました。");
  });
});

describe("shouldShowRetry", () => {
  it.each([
    { error: new ExternalServiceError(), expected: true },
    { error: new RateLimitExceededError(), expected: true },
    { error: new InvalidPageError(), expected: false },
    { error: new EmptySearchQueryError(), expected: false },
  ])("$error.name のとき再試行ボタン表示が $expected であること", ({ error, expected }) => {
    // Act
    const result = shouldShowRetry(error);

    // Assert
    expect(result).toBe(expected);
  });
});
