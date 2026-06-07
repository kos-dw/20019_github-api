"use client";

import { ExternalServiceError, RateLimitExceededError } from "@/app/_shared/github/errors";
import { useEffect } from "react";

function getErrorMessage(error: Error): string {
  if (error instanceof RateLimitExceededError) {
    return "アクセス上限に達しました。しばらく待ってから再試行してください。";
  }
  if (error instanceof ExternalServiceError) {
    return "サーバーエラーが発生しました。時間をおいて再試行してください。";
  }

  return "予期しないエラーが発生しました。";
}

function shouldShowRetry(error: Error): boolean {
  return error instanceof ExternalServiceError || error instanceof RateLimitExceededError;
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p role="alert" className="text-red-600">
        {getErrorMessage(error)}
      </p>
      {shouldShowRetry(error) && (
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          再試行
        </button>
      )}
    </div>
  );
}
