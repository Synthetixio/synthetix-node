const { promises: fs } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(os.homedir(), '.synthetix');
const DEFAULTS = Object.freeze({
  tray: true,
  dock: true,
});

async function read() {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, 'setting.json'), 'utf8'));
  } catch (_error) {
    return DEFAULTS;
  }
}

async function write(settings) {
  try {
    await fs.writeFile(path.join(ROOT, 'setting.json'), JSON.stringify(settings, null, 2), 'utf8');
  } catch (_error) {
    // whatever
  }
  return settings;
}

async function get(key) {
  const all = await read();
  return all[key];
}

async function set(key, value) {
  const all = await read();
  return await write({ ...all, [key]: value });
}

module.exports = {
  ROOT,
  read,
  write,
  get,
  set,
};
