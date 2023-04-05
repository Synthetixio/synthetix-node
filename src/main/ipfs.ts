import { exec, spawn } from 'child_process';
import https from 'https';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
  readFileSync,
  rmSync,
} from 'fs';
import { pipeline } from 'stream/promises';
import os from 'os';
import zlib from 'zlib';
import tar from 'tar';
import path from 'path';

const ROOT = path.join(os.homedir(), '.synthetix');

function execCommand(command) {
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

export async function ipfsDaemon() {
  const daemon = spawn(path.join(ROOT, 'go-ipfs/ipfs'), ['daemon'], {
    stdio: 'pipe',
  });
  daemon.stderr.on('data', (data) => process.stderr.write(data));
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(path.join(ROOT, 'ipfs.pid'), `${daemon.pid}`, 'utf8');

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for daemon to start')),
      30000
    );
    daemon.stdout.on('data', (data) => {
      process.stdout.write(data);
      if (`${data}`.includes('Daemon is ready')) {
        clearTimeout(timer);
        resolve(true);
      }
    });
  });
}

export function ipfsKill() {
  try {
    const pid = parseInt(readFileSync(path.join(ROOT, 'ipfs.pid'), 'utf8'), 10);
    process.kill(pid);
    rmSync(path.join(ROOT, 'ipfs.pid'));
  } catch (_e) {
    // whatever
  }
}

export async function ipfsIsRunning() {
  try {
    await fs.access(path.join(ROOT, 'ipfs.pid'), fs.constants.F_OK);
    const pid = parseInt(
      await fs.readFile(path.join(ROOT, 'ipfs.pid'), 'utf8'),
      10
    );
    return process.kill(pid, 0);
  } catch (_e) {
    return false;
  }
}

export async function ipfsIsConfigured() {
  try {
    await fs.access(path.join(os.homedir(), '.ipfs'), fs.constants.F_OK);
    return true;
  } catch (_e) {
    return false;
  }
}

export async function ipfsIsInstalled() {
  try {
    await fs.access(path.join(ROOT, 'go-ipfs/ipfs'), fs.constants.F_OK);
    return true;
  } catch (_e) {
    return false;
  }
}

export async function ipfs(arg) {
  return execCommand(`${path.join(ROOT, 'go-ipfs/ipfs')} ${arg}`);
}

export async function getLatestVersion() {
  return new Promise((resolve, reject) => {
    https
      .get('https://dist.ipfs.tech/go-ipfs/versions', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data.trim().split('\n').pop());
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

export async function downloadIpfs({ log = console.log } = {}) {
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

export async function configureIpfs({ log = console.log } = {}) {
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
  log(await ipfs('config profile apply lowpower'));
}
