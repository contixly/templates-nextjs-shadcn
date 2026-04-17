"use client";

import React from "react";

export default function GlobalErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md text-sm">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
