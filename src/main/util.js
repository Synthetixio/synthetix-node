function getPlatformDetails() {
  const targetArch = (() => {
    switch (process.arch) {
      case 'x64':
        return 'amd64';
      case 'arm64':
        return 'arm64';
      default:
        return process.arch;
    }
  })();
  const osPlatform = (() => {
    switch (process.platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'darwin';
      case 'linux':
        return 'linux';
      default:
        return process.platform;
    }
  })();
  const fileExt = (() => {
    switch (process.platform) {
      case 'win32':
        return 'zip';
      case 'darwin':
        return 'tar.gz';
      case 'linux':
        return 'tar.gz';
      default:
        return 'tar.gz';
    }
  })();
  return { osPlatform, fileExt, targetArch };
}

module.exports = { getPlatformDetails };
