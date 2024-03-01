import os from 'os';

export function getPlatformDetails() {
  const arch = os.arch();
  const targetArch = arch === 'x64' ? 'amd64' : 'arm64';
  const osPlatform = process.platform === 'darwin' ? 'darwin' : 'windows';
  const fileExt = osPlatform === 'darwin' ? 'tar.gz' : 'zip';
  return { osPlatform, fileExt, targetArch };
}
