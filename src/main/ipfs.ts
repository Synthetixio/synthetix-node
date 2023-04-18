import { exec, spawn } from 'child_process';
import https from 'https';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
  rmSync,
} from 'fs';
import { pipeline } from 'stream/promises';
import os from 'os';
import zlib from 'zlib';
import tar from 'tar';
import http from 'http';
import path from 'path';
import type { IpcMainInvokeEvent } from 'electron';
import { getPid, getPidsSync } from './pid';
import logger from 'electron-log';

const ROOT = path.join(os.homedir(), '.synthetix');

function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message} (${stderr})`;
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function ipfsKill() {
  try {
    getPidsSync('.synthetix/go-ipfs/ipfs').forEach((pid) => {
      logger.log('Killing ipfs', pid);
      process.kill(pid);
    });
    logger.log('Removing ~/.ipfs/repo.lock');
    rmSync(path.join(os.homedir(), '.ipfs/repo.lock'), {
      recursive: true,
    });
  } catch (_e) {
    // whatever
  }
}

export async function ipfsPid() {
  return await getPid('.synthetix/go-ipfs/ipfs daemon');
}

export async function ipfsIsInstalled() {
  try {
    await fs.access(path.join(ROOT, 'go-ipfs/ipfs'), fs.constants.F_OK);
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
  const pid = await getPid('.synthetix/go-ipfs/ipfs daemon');
  if (!pid) {
    await configureIpfs();
    spawn(path.join(ROOT, 'go-ipfs/ipfs'), ['daemon'], {
      stdio: 'inherit',
      detached: true,
    });
  }
}

export async function ipfs(arg: string) {
  return execCommand(`${path.join(ROOT, 'go-ipfs/ipfs')} ${arg}`);
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
    const ipfsVersion = await ipfs('--version');
    const [, , installedVersion] = ipfsVersion.split(' ');
    return installedVersion;
  } catch (_error) {
    return null;
  }
}

export async function downloadIpfs(
  _e?: IpcMainInvokeEvent,
  { log = logger.log } = {}
) {
  const arch = os.arch();
  const targetArch = arch === 'x64' ? 'amd64' : 'arm64';

  log('Checking for existing ipfs installation...');

  const latestVersion = await getLatestVersion();
  const latestVersionNumber = latestVersion.slice(1);
  const installedVersion = await getInstalledVersion();

  if (installedVersion === latestVersionNumber) {
    log(`ipfs version ${installedVersion} is already installed.`);
    return;
  }

  if (installedVersion) {
    log(
      `Updating ipfs from version ${installedVersion} to ${latestVersionNumber}`
    );
  } else {
    log(`Installing ipfs version ${latestVersionNumber}`);
  }

  const downloadUrl = `https://dist.ipfs.tech/go-ipfs/${latestVersion}/go-ipfs_${latestVersion}_darwin-${targetArch}.tar.gz`;
  log(`IPFS package: ${downloadUrl}`);

  await fs.mkdir(ROOT, { recursive: true });
  await new Promise((resolve, reject) => {
    const file = createWriteStream(path.join(ROOT, 'ipfs.tar.gz'));
    https.get(downloadUrl, (response) =>
      pipeline(response, file).then(resolve).catch(reject)
    );
  });

  await new Promise((resolve, reject) => {
    createReadStream(path.join(ROOT, 'ipfs.tar.gz'))
      .pipe(zlib.createGunzip())
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
    log(
      await ipfs(
        'config --json API.HTTPHeaders.Access-Control-Allow-Origin \'["*"]\''
      )
    );
    log(
      await ipfs(
        'config --json API.HTTPHeaders.Access-Control-Allow-Methods \'["PUT", "POST", "GET"]\''
      )
    );
    // log(await ipfs('config profile apply lowpower'));
  } catch (_error) {
    // whatever
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
