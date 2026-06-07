import { describe, expect, it } from "vitest";
import { DomainError } from "./domain";
import { ExternalServiceError, RateLimitExceededError, RepoNotFoundError } from "./errors";

describe("RepoNotFoundError", () => {
  it("基底の DomainError を正しく継承していること", () => {
    // Act
    const error = new RepoNotFoundError();

    // Assert
    expect(error).toBeInstanceOf(DomainError);
  });

  it('値が "REPO_NOT_FOUND" であること', () => {
    // Arrange
    const expectedCode = "REPO_NOT_FOUND";

    // Act
    const error = new RepoNotFoundError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});

describe("RateLimitExceededError", () => {
  it("基底の DomainError を正しく継承していること", () => {
    // Act
    const error = new RateLimitExceededError();

    // Assert
    expect(error).toBeInstanceOf(DomainError);
  });

  it('エラーコードの値が "RATE_LIMIT_EXCEEDED" であること', () => {
    // Arrange
    const expectedCode = "RATE_LIMIT_EXCEEDED";

    // Act
    const error = new RateLimitExceededError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});

describe("ExternalServiceError", () => {
  it("基底の DomainError を正しく継承していること", () => {
    // Act
    const error = new ExternalServiceError();

    // Assert
    expect(error).toBeInstanceOf(DomainError);
  });

  it('エラーコードの値が "EXTERNAL_SERVICE_ERROR" であること', () => {
    // Arrange
    const expectedCode = "EXTERNAL_SERVICE_ERROR";

    // Act
    const error = new ExternalServiceError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});
