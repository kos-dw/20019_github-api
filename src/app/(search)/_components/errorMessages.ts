import { EmptySearchQueryError, InvalidPageError } from "@/app/_shared/github/domain";
import { ExternalServiceError, RateLimitExceededError } from "@/app/_shared/github/errors";

export function getErrorMessage(error: Error): string {
  if (error instanceof EmptySearchQueryError) {
    return "検索キーワードを入力してください。";
  }
  if (error instanceof InvalidPageError) {
    return "指定されたページが不正です。";
  }
  if (error instanceof RateLimitExceededError) {
    return "アクセス上限に達しました。しばらく待ってから再試行してください。";
  }
  if (error instanceof ExternalServiceError) {
    return "サーバーエラーが発生しました。時間をおいて再試行してください。";
  }

  return "予期しないエラーが発生しました。";
}

export function shouldShowRetry(error: Error): boolean {
  return error instanceof ExternalServiceError || error instanceof RateLimitExceededError;
}
