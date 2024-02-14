import { exec, spawn } from 'child_process';
import https from 'https';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import os from 'os';
import zlib from 'zlib';
import tar from 'tar';
import path from 'path';
import type { IpcMainInvokeEvent } from 'electron';
import logger from 'electron-log';
import { SYNTHETIX_IPNS } from '../const';
import { ROOT } from './settings';
import { getPid, getPidsSync } from './pid';
import unzipper from 'unzipper';
import { getPlatformDetails } from './util';

// Change if we ever want to store all follower info in a custom folder
const HOME = os.homedir();
const IPFS_FOLLOW_PATH = path.join(HOME, '.ipfs-cluster-follow');

export function followerKill() {
  try {
    getPidsSync(
      process.platform === 'win32'
        ? 'ipfs-cluster-follow.exe'
        : '.synthetix/ipfs-cluster-follow/ipfs-cluster-follow synthetix run'
    ).forEach((pid) => {
      logger.log('Killing ipfs-cluster-follow', pid);
      process.kill(pid);
    });
  } catch (_e) {
    // whatever
  }
}

export async function followerPid() {
  return await getPid(
    process.platform === 'win32'
      ? 'ipfs-cluster-follow.exe'
      : '.synthetix/ipfs-cluster-follow/ipfs-cluster-follow synthetix run'
  );
}

export async function followerIsInstalled() {
  try {
    await fs.access(
      path.join(
        ROOT,
        process.platform === 'win32'
          ? 'ipfs-cluster-follow/ipfs-cluster-follow.exe'
          : 'ipfs-cluster-follow/ipfs-cluster-follow'
      ),
      fs.constants.F_OK
    );
    return true;
  } catch (_e) {
    return false;
  }
}

export async function followerDaemon() {
  const isInstalled = await followerIsInstalled();
  if (!isInstalled) {
    return;
  }

  const pid = await getPid(
    process.platform === 'win32'
      ? 'ipfs-cluster-follow.exe'
      : '.synthetix/ipfs-cluster-follow/ipfs-cluster-follow synthetix run'
  );

  if (!pid) {
    await configureFollower();

    try {
      // Cleanup locks in case of a previous crash
      await Promise.all([
        fs.rm(path.join(IPFS_FOLLOW_PATH, 'synthetix/badger'), {
          recursive: true,
          force: true,
        }),
        fs.rm(path.join(IPFS_FOLLOW_PATH, 'synthetix/api-socket'), {
          recursive: true,
          force: true,
        }),
      ]);
    } catch (e) {
      logger.error(e);
      // whatever
    }

    spawn(path.join(ROOT, 'ipfs-cluster-follow/ipfs-cluster-follow'), ['synthetix', 'run'], {
      stdio: 'inherit',
      detached: true,
      env: { HOME },
    });
  }
}

export async function follower(arg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `${path.join(ROOT, 'ipfs-cluster-follow/ipfs-cluster-follow')} ${arg}`,
      { encoding: 'utf8', env: { HOME } },
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
      .get('https://dist.ipfs.tech/ipfs-cluster-follow/versions', (res) => {
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
    const version = await follower('--version');
    const [, , installedVersion] = version.split(' ');
    return installedVersion;
  } catch (_error) {
    return null;
  }
}

export async function downloadFollower(_e?: IpcMainInvokeEvent, { log = logger.log } = {}) {
  const { osPlatform, fileExt, targetArch } = getPlatformDetails();

  log('Checking for existing ipfs-cluster-follow installation...');

  const latestVersion = await getLatestVersion();
  const latestVersionNumber = latestVersion.slice(1);
  const installedVersion = await getInstalledVersion();

  if (installedVersion === latestVersionNumber) {
    log(`ipfs-cluster-follow version ${installedVersion} is already installed.`);
    return;
  }

  if (installedVersion) {
    log(`Updating ipfs-cluster-follow from version ${installedVersion} to ${latestVersionNumber}`);
  } else {
    log(`Installing ipfs-cluster-follow version ${latestVersionNumber}`);
  }

  const downloadUrl = `https://dist.ipfs.tech/ipfs-cluster-follow/${latestVersion}/ipfs-cluster-follow_${latestVersion}_${osPlatform}-${targetArch}.${fileExt}`;
  log(`ipfs-cluster-follow package: ${downloadUrl}`);

  await fs.mkdir(ROOT, { recursive: true });
  await new Promise((resolve, reject) => {
    const file = createWriteStream(path.join(ROOT, `ipfs-cluster-follow.${fileExt}`));
    https.get(downloadUrl, (response) => pipeline(response, file).then(resolve).catch(reject));
  });

  await new Promise((resolve, reject) => {
    createReadStream(path.join(ROOT, `ipfs-cluster-follow.${fileExt}`))
      .pipe(fileExt === 'zip' ? unzipper.Extract({ path: ROOT }) : zlib.createGunzip())
      .pipe(tar.extract({ cwd: ROOT }))
      .on('error', reject)
      .on('end', resolve);
  });

  const installedVersionCheck = await getInstalledVersion();
  if (installedVersionCheck) {
    log(`ipfs-cluster-follow version ${installedVersionCheck} installed successfully.`);
  } else {
    throw new Error('ipfs-cluster-follow installation failed.');
  }

  return installedVersionCheck;
}

export async function isConfigured() {
  try {
    const service = await fs.readFile(
      path.join(IPFS_FOLLOW_PATH, 'synthetix/service.json'),
      'utf8'
    );
    return service.includes(SYNTHETIX_IPNS);
  } catch (_error) {
    return false;
  }
}

export async function followerId() {
  try {
    const identity = JSON.parse(
      await fs.readFile(path.join(IPFS_FOLLOW_PATH, 'synthetix/identity.json'), 'utf8')
    );
    return identity.id;
  } catch (_error) {
    return '';
  }
}

export async function configureFollower({ log = logger.log } = {}) {
  if (await isConfigured()) {
    return;
  }
  try {
    await fs.rm(path.join(IPFS_FOLLOW_PATH, 'synthetix'), { recursive: true, force: true });
    log(await follower(`synthetix init "http://127.0.0.1:8080/ipns/${SYNTHETIX_IPNS}"`));
  } catch (e) {
    logger.error(e);
    // whatever
  }
}
