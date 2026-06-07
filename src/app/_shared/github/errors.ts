import { DomainError } from "./domain";

export class RepoNotFoundError extends DomainError {
  readonly code = "REPO_NOT_FOUND";
  constructor(message = "the specified repository was not found") {
    super(message);
  }
}

export class RateLimitExceededError extends DomainError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  constructor(message = "github api rate limit exceeded. please try again later") {
    super(message);
  }
}

export class ExternalServiceError extends DomainError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  constructor(message = "an external service error occurred") {
    super(message);
  }
}
