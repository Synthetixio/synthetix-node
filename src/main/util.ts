import { URL } from 'url';
import path from 'path';

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
  const targetArch = (() => {
    switch (process.arch) {
      case 'x64':
        return 'amd64';
      case 'arm64':
      default:
        return process.arch;
    }
  })();
  const osPlatform = (() => {
    switch (process.platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
      case 'linux':
      default:
        return process.platform;
    }
  })();
  const fileExt = (() => {
    switch (process.platform) {
      case 'win32':
        return 'zip';
      case 'darwin':
      case 'linux':
      default:
        return 'tar.gz';
    }
  })();
  return { osPlatform, fileExt, targetArch };
}
