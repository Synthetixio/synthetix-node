const { exec } = require('child_process');
const https = require('https');
const { createReadStream, createWriteStream, promises: fs } = require('fs');
const { pipeline } = require('stream').promises;
const os = require('os');
const zlib = require('zlib');
const tar = require('tar');

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

async function getLatestVersion() {
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

async function getInstalledVersion() {
  try {
    const ipfsVersion = await execCommand('./ipfs --version');
    const [, , installedVersion] = ipfsVersion.split(' ');
    return installedVersion;
  } catch (_error) {
    return null;
  }
}

async function downloadIpfs({ log }) {
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
  log(`DOWNLOAD_URL=${downloadUrl}`);

  await new Promise((resolve, reject) => {
    const file = createWriteStream('ipfs.tar.gz');
    https.get(downloadUrl, (response) =>
      pipeline(response, file).then(resolve).catch(reject)
    );
  });

  await new Promise((resolve, reject) => {
    createReadStream('ipfs.tar.gz')
      .pipe(zlib.createGunzip())
      .pipe(tar.extract({ cwd: '.' }))
      .on('error', reject)
      .on('end', resolve);
  });

  await fs.unlink('ipfs.tar.gz');
  await fs.rename('./go-ipfs/ipfs', './ipfs');
  await fs.rm('./go-ipfs', { recursive: true, force: true });

  const installedVersionCheck = await getInstalledVersion();
  if (installedVersionCheck) {
    log(`ipfs version ${installedVersionCheck} installed successfully.`);
  } else {
    throw new Error('IPFS installation failed.');
  }
  return installedVersionCheck;
}

async function ipfs(arg) {
  return execCommand(`./ipfs ${arg}`);
}

module.exports = {
  downloadIpfs,
  ipfs,
};
