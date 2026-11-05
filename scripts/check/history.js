const ALIVE = new Set(['ok', 'listed']);
const MAX_EVENTS = 20;

/**
 * Keep a trace of each shop over time: first seen, last seen alive, dead since,
 * and the last status changes. `prev` is the shop's state from the previous run.
 */
export function withHistory(next, prev = {}, now = new Date().toISOString()) {
  const alive = ALIVE.has(next.status);
  const history = [...(prev.history || [])];
  if (prev.status !== next.status) history.push({ at: now, status: next.status, reason: next.reason || null });
  return {
    ...next,
    firstSeen: prev.firstSeen || now,
    lastAliveAt: alive ? now : prev.lastAliveAt || null,
    deadSince: next.status === 'dead' ? prev.deadSince || now : null,
    history: history.slice(-MAX_EVENTS),
  };
}
