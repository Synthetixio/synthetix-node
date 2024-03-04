import { URL } from 'url';
import path from 'path';
import os from 'os';

const PLATFORM_OVERRIDE = {
  win32: 'windows',
};

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getPlatformDetails() {
  const arch = os.arch();
  const targetArch = arch === 'x64' ? 'amd64' : 'arm64';
  const osPlatform =
    PLATFORM_OVERRIDE[process.platform as keyof typeof PLATFORM_OVERRIDE] || process.platform;
  const fileExt = osPlatform === 'windows' ? 'zip' : 'tar.gz';
  return { osPlatform, fileExt, targetArch };
}
