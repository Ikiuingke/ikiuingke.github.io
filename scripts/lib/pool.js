/** Run `worker` over `items` with at most `limit` in flight. */
export async function pool(items, limit, worker) {
  const queue = [...items];
  const results = [];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  });
  await Promise.all(runners);
  return results;
}

/** A counting semaphore, used to cap concurrent requests per platform. */
export function semaphore(limit) {
  let active = 0;
  const waiting = [];
  const release = () => { active--; waiting.shift()?.(); };
  return async (fn) => {
    while (active >= limit) await new Promise((r) => waiting.push(r));
    active++;
    try { return await fn(); } finally { release(); }
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
