import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const ROOT = path.join(os.homedir(), '.synthetix');
const DEFAULTS = Object.freeze({
  tray: true,
  dock: true,
});

export async function read() {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, 'setting.json'), 'utf8'));
  } catch (_error) {
    return DEFAULTS;
  }
}

export async function write(settings: typeof DEFAULTS) {
  try {
    await fs.writeFile(path.join(ROOT, 'setting.json'), JSON.stringify(settings, null, 2), 'utf8');
  } catch (_error) {
    // whatever
  }
  return settings;
}

export async function get(key: string) {
  const all = await read();
  return all[key];
}

export async function set(key: string, value: boolean) {
  const all = await read();
  return await write({ ...all, [key]: value });
}
