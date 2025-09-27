"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ padding: 16, fontFamily: "system-ui, Arial" }}>
        <h1>Something went wrong</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
        {error.stack && (
          <details>
            <summary>Stack</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
          </details>
        )}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
