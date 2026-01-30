const listeners = new Map<string, number>(); // id -> last update timestamp (ms)

const EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

export function radioHeartbeat(id: string): void {
  listeners.set(id, Date.now());
}

export function getRadioCount(): number {
  purgeExpiredListeners();
  return listeners.size;
}

function purgeExpiredListeners(): void {
  const cutoff = Date.now() - EXPIRATION_MS;
  for (const [id, lastSeen] of listeners) {
    if (lastSeen < cutoff) {
      listeners.delete(id);
    }
  }
}

export function startRadioPurgeInterval(): NodeJS.Timeout {
  return setInterval(() => {
    const before = listeners.size;
    purgeExpiredListeners();
    const purged = before - listeners.size;
    if (purged > 0) {
      console.log(`Purged ${purged} expired radio listeners`);
    }
  }, 60 * 1000); // every 1 minute
}
