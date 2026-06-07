import { afterEach, describe, expect, test } from "vitest";
import { env } from "./env";

describe("env.githubToken", () => {
  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  test("GITHUB_TOKEN が設定されている場合、その設定値を正しく返すこと", () => {
    // Arrange
    const expectedToken = "test-token";
    process.env.GITHUB_TOKEN = expectedToken;

    // Act
    const actualToken = env.githubToken;

    // Assert
    expect(actualToken).toBe(expectedToken);
  });

  test("GITHUB_TOKEN が未設定の場合、undefined を返すこと", () => {
    // Act
    const actualToken = env.githubToken;

    // Assert
    expect(actualToken).toBeUndefined();
  });
});
