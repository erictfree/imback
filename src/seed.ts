import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setPin } from './store/pinStore.js';
import { PinRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SeedPin {
  deviceId: string;
  latitude: number;
  longitude: number;
  playlistName: string;
  [key: string]: unknown;
}

let seedPins: SeedPin[] = [];

function loadSeedData(): void {
  const data = readFileSync(join(__dirname, 'seedData.json'), 'utf-8');
  seedPins = JSON.parse(data);
}

function injectSeeds(): void {
  const now = new Date().toISOString();

  for (const pin of seedPins) {
    const record: PinRecord = {
      deviceId: pin.deviceId,
      latitude: pin.latitude,
      longitude: pin.longitude,
      timestamp: now,
      playlistName: pin.playlistName,
      payload: { ...pin, timestamp: now },
    };
    setPin(record);
  }
}

export function startSeedData(): void {
  loadSeedData();
  injectSeeds();
  console.log(`SEED: Loaded ${seedPins.length} test pins`);

  // Refresh timestamps every 10 minutes so they never expire
  setInterval(() => {
    injectSeeds();
    console.log(`SEED: Refreshed ${seedPins.length} test pins`);
  }, 10 * 60 * 1000);
}
