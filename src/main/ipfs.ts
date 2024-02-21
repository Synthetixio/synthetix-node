import { exec, spawn, execSync } from 'child_process';
import https from 'https';
import { createReadStream, createWriteStream, promises as fs, rmSync } from 'fs';
import { pipeline } from 'stream/promises';
import os from 'os';
import zlib from 'zlib';
import tar from 'tar';
import http from 'http';
import path from 'path';
import type { IpcMainInvokeEvent } from 'electron';
import { ROOT } from './settings';
import logger from 'electron-log';
import unzipper from 'unzipper';
import { getPlatformDetails } from './util';

const HOME = os.homedir();
// Change if we ever want IPFS to store its data in non-standart path
const IPFS_PATH = path.join(HOME, '.ipfs');

const BASE_URL = new URL('http://127.0.0.1:5001/api/v0/');
export async function rpcRequest(
  relativePath: string,
  args: string[] = [],
  flags?: { [key: string]: any }
): Promise<any> {
  const query = new URLSearchParams(flags);
  args.forEach((arg) => query.append('arg', arg));
  const url = new URL(relativePath, BASE_URL);
  const res = await fetch(`${url}?${query}`, { method: 'POST' });

  if (res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      return res.text();
    }
  } else {
    throw new Error(`RPC HTTP Error: ${res.status} on path: ${relativePath}`);
  }
}

export function ipfsTeardown() {
  try {
    execSync(
      process.platform === 'win32' ? 'ipfs.exe shutdown' : '.synthetix/go-ipfs/ipfs shutdown'
    );
    rmSync(path.join(ROOT, 'ipfs.pid'), { recursive: true });
    rmSync(path.join(IPFS_PATH, 'repo.lock'), { recursive: true });
    logger.log('IPFS teardown: PID file removed, daemon shutdown, and repo.lock removed');
  } catch (e) {
    logger.log('IPFS teardown error:', e);
  }
}

export async function ipfsIsInstalled() {
  try {
    await fs.access(
      path.join(ROOT, process.platform === 'win32' ? 'go-ipfs/ipfs.exe' : 'go-ipfs/ipfs'),
      fs.constants.F_OK
    );
    return true;
  } catch (_e) {
    return false;
  }
}

export async function ipfsDaemon() {
  const isInstalled = await ipfsIsInstalled();
  if (!isInstalled) {
    return;
  }

  const pid = await fs.readFile(path.join(ROOT, 'ipfs.pid'), 'utf8').catch(() => null);

  if (pid) {
    return;
  }

  await configureIpfs();
  const { pid: ipfsPid } = spawn(path.join(ROOT, 'go-ipfs/ipfs'), ['daemon'], {
    stdio: 'inherit',
    env: { IPFS_PATH },
  });
  if (ipfsPid) {
    await fs.writeFile(path.join(ROOT, 'ipfs.pid'), ipfsPid.toString(), 'utf8');
  }
}

export async function ipfs(arg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `${path.join(ROOT, 'go-ipfs/ipfs')} ${arg}`,
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

export async function getLatestVersion(): Promise<string> {
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

export async function getInstalledVersion() {
  try {
    const result = await rpcRequest('version');
    return result.Version;
  } catch (_error) {
    return null;
  }
}

export async function downloadIpfs(_e?: IpcMainInvokeEvent, { log = logger.log } = {}) {
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

  await new Promise((resolve, reject) => {
    createReadStream(path.join(ROOT, `ipfs.${fileExt}`))
      .pipe(fileExt === 'zip' ? unzipper.Extract({ path: ROOT }) : zlib.createGunzip())
      .pipe(tar.extract({ cwd: ROOT }))
      .on('error', reject)
      .on('end', resolve);
  });

  const installedVersionCheck = await getInstalledVersion();
  if (installedVersionCheck) {
    log(`ipfs version ${installedVersionCheck} installed successfully.`);
  } else {
    throw new Error('IPFS installation failed.');
  }

  return installedVersionCheck;
}

export async function configureIpfs({ log = logger.log } = {}) {
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

export async function ipfsIsRunning() {
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

export async function waitForIpfs() {
  let isRunning = await ipfsIsRunning();
  while (!isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    isRunning = await ipfsIsRunning();
  }
}
