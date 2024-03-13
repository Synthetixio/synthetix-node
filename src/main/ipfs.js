const { exec, spawn } = require('node:child_process');
const { promises: fs, createReadStream, createWriteStream, rmSync } = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const zlib = require('node:zlib');
const AdmZip = require('adm-zip');
const logger = require('electron-log');
const tar = require('tar');
const { ROOT } = require('./settings');
const { getPlatformDetails } = require('./util');

const HOME = os.homedir();
// Change if we ever want IPFS to store its data in non-standart path
const IPFS_PATH = path.join(HOME, '.ipfs');
const IPFS_CLI = path.join(
  ROOT,
  process.platform === 'win32' ? 'go-ipfs/ipfs.exe' : 'go-ipfs/ipfs'
);

const BASE_URL = new URL('http://127.0.0.1:5001/api/v0/');
async function rpcRequest(relativePath, args = [], flags = {}) {
  const query = new URLSearchParams(flags);
  for (const arg of args) {
    query.append('arg', arg);
  }
  const url = new URL(relativePath, BASE_URL);
  const res = await fetch(`${url}?${query}`, { method: 'POST' });

  if (res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }
  throw new Error(`RPC HTTP Error: ${res.status} on path: ${relativePath}`);
}

function ipfsTeardown() {
  rmSync(path.join(ROOT, 'ipfs.pid'), { force: true });
  rmSync(path.join(IPFS_PATH, 'repo.lock'), { force: true });
}

async function ipfsIsInstalled() {
  try {
    await fs.access(IPFS_CLI, fs.constants.F_OK);
    return true;
  } catch (_e) {
    return false;
  }
}

async function ipfsDaemon() {
  const isInstalled = await ipfsIsInstalled();
  if (!isInstalled) {
    return;
  }

  const isRunning = await ipfsIsRunning();
  if (isRunning) {
    return;
  }

  await configureIpfs();
  const { pid: ipfsPid } = spawn(IPFS_CLI, ['daemon'], { stdio: 'inherit', env: { IPFS_PATH } });
  if (ipfsPid) {
    await fs.writeFile(path.join(ROOT, 'ipfs.pid'), ipfsPid.toString(), 'utf8');
  }
}

async function ipfs(arg) {
  return new Promise((resolve, reject) => {
    exec(
      `${IPFS_CLI} ${arg}`,
      { encoding: 'utf8', env: { IPFS_PATH } },
      (error, stdout, stderr) => {
        if (error) {
          error.message = `${error.message} (${stderr})`;
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

async function getLatestVersion() {
  return new Promise((resolve, reject) => {
    https
      .get('https://dist.ipfs.tech/go-ipfs/versions', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data.trim().split('\n').pop() || '');
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function getInstalledVersion() {
  try {
    const result = await rpcRequest('version');
    return result.Version;
  } catch (_error) {
    return null;
  }
}

async function downloadIpfs(_e, { log = logger.log } = {}) {
  const { osPlatform, fileExt, targetArch } = getPlatformDetails();

  log('Checking for existing ipfs installation...');

  const latestVersion = await getLatestVersion();
  const latestVersionNumber = latestVersion.slice(1);
  const installedVersion = await getInstalledVersion();

  if (installedVersion === latestVersionNumber) {
    log(`ipfs version ${installedVersion} is already installed.`);
    return;
  }

  if (installedVersion) {
    log(`Updating ipfs from version ${installedVersion} to ${latestVersionNumber}`);
  } else {
    log(`Installing ipfs version ${latestVersionNumber}`);
  }

  const downloadUrl = `https://dist.ipfs.tech/go-ipfs/${latestVersion}/go-ipfs_${latestVersion}_${osPlatform}-${targetArch}.${fileExt}`;
  log(`IPFS package: ${downloadUrl}`);

  await fs.rm(path.join(IPFS_PATH, 'config'), { recursive: true }).catch(() => {});
  await fs.mkdir(ROOT, { recursive: true });
  await new Promise((resolve, reject) => {
    const file = createWriteStream(path.join(ROOT, `ipfs.${fileExt}`));
    https.get(downloadUrl, (response) => pipeline(response, file).then(resolve).catch(reject));
  });

  if (fileExt === 'zip') {
    const zip = new AdmZip(path.join(ROOT, `ipfs.${fileExt}`));
    await zip.extractAllTo(ROOT, true);
  } else {
    await new Promise((resolve, reject) => {
      createReadStream(path.join(ROOT, `ipfs.${fileExt}`))
        .pipe(zlib.createGunzip())
        .pipe(tar.extract({ cwd: ROOT }))
        .on('error', reject)
        .on('end', resolve);
    });
  }

  const isInstalled = await ipfsIsInstalled();
  if (isInstalled) {
    log('IPFS installed successfully');
  } else {
    throw new Error('IPFS installation failed.');
  }

  return isInstalled;
}

async function configureIpfs({ log = logger.log } = {}) {
  try {
    log(await ipfs('init'));
    log(await ipfs('config --json API.HTTPHeaders.Access-Control-Allow-Origin \'["*"]\''));
    log(
      await ipfs(
        'config --json API.HTTPHeaders.Access-Control-Allow-Methods \'["PUT", "POST", "GET"]\''
      )
    );
    // log(await ipfs('config profile apply lowpower'));
  } catch (error) {
    logger.error(error);
  }
}

async function ipfsIsRunning() {
  return new Promise((resolve, _reject) => {
    http
      .get('http://127.0.0.1:5001', (res) => {
        const { statusCode } = res;
        if (statusCode === 404) {
          resolve(true);
        } else {
          resolve(false);
        }
        res.resume();
      })
      .once('error', (_error) => resolve(false));
  });
}

async function waitForIpfs() {
  let isRunning = await ipfsIsRunning();
  while (!isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    isRunning = await ipfsIsRunning();
  }
}

module.exports = {
  rpcRequest,
  ipfsTeardown,
  ipfsIsInstalled,
  ipfsDaemon,
  ipfs,
  getLatestVersion,
  getInstalledVersion,
  downloadIpfs,
  configureIpfs,
  ipfsIsRunning,
  waitForIpfs,
};
