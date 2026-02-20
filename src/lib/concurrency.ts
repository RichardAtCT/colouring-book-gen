export const PAGE_GENERATION_CONCURRENCY = 5;

/**
 * Runs tasks with bounded concurrency, maintaining positional correspondence.
 * Workers drain a shared queue; abortRef is checked before dispatching each task.
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  abortRef?: { current: boolean }
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      if (abortRef?.current) return;
      const i = nextIndex++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
