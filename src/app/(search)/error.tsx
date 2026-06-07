"use client";

import { useEffect } from "react";
import { getErrorMessage, shouldShowRetry } from "./_components/errorMessages";

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
