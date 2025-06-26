/** Run Promise.allSettled in batches */
export async function allSettledInBatches<T = any>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  let index = 0;

  async function runBatch() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        const value = await tasks[currentIndex]();
        results[currentIndex] = { status: 'fulfilled', value };
      } catch (reason) {
        results[currentIndex] = { status: 'rejected', reason };
      }
    }
  }

  // Start up to batchSize concurrent runners
  const runners = Array.from({ length: batchSize }, () => runBatch());
  await Promise.allSettled(runners);

  return results;
}
