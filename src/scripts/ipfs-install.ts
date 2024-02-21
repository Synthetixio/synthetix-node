import { downloadIpfs, ipfsDaemon, ipfsTeardown } from '../main/ipfs';

async function main() {
  await downloadIpfs();
  await ipfsDaemon();
}

process.on('beforeExit', ipfsTeardown);
main();
