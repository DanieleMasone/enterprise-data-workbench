import { useCallback, useState } from 'react';

/** Wraps async domain commands with UI-safe pending and error state. */
export function useOptimisticMutation<TArgs extends readonly unknown[]>(
  mutation: (...args: TArgs) => Promise<void>,
): {
  readonly run: (...args: TArgs) => Promise<void>;
  readonly isPending: boolean;
  readonly error: string | null;
} {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setPending(true);
      setError(null);
      try {
        await mutation(...args);
      } catch (unknownError) {
        setError(unknownError instanceof Error ? unknownError.message : 'The operation failed.');
      } finally {
        setPending(false);
      }
    },
    [mutation],
  );

  return { run, isPending, error };
}
