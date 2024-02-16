import { URL } from 'url';
import path from 'path';
import os from 'os';

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
  const osPlatform = process.platform === 'darwin' ? 'darwin' : 'windows';
  const fileExt = osPlatform === 'darwin' ? 'tar.gz' : 'zip';
  return { osPlatform, fileExt, targetArch };
}

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
