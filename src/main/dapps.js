const logger = require('electron-log');
const { EnsResolver, getDefaultProvider } = require('ethers');
const { rpcRequest } = require('./ipfs');

const DAPPS = [];

const provider = getDefaultProvider();

async function resolveEns(dapp) {
  if (dapp.ipns) {
    return {
      codec: 'ipns-ns',
      hash: dapp.ipns,
    };
  }
  if (!dapp.ens) {
    throw new Error('Neither ipns nor ens was set, cannot resolve');
  }

  const ensResolver = await EnsResolver.fromName(provider, dapp.ens);

  if (!ensResolver) {
    throw new Error(`No resolver found for the ENS name: ${dapp.ens}`);
  }
  const contentHash = await ensResolver.getContentHash();

  if (!contentHash) {
    throw new Error(`No content hash found for the ENS name: ${dapp.ens}`);
  }
  const [codec, hash] = contentHash.split('://');

  return { codec, hash };
}

async function resolveQm(ipns) {
  try {
    const ipfsPath = await rpcRequest('name/resolve', [ipns]);
    const qm = ipfsPath.Path.slice(6); // remove /ipfs/
    return qm; // Qm
  } catch {
    logger.error('Invalid IPFS path received.');
    return '';
  }
}

async function convertCid(qm) {
  try {
    const res = await rpcRequest('cid/base32', [qm]);
    return res.CidStr;
  } catch (e) {
    logger.error(`Error during CID conversion. Details: ${e}`);
    return '';
  }
}

async function isPinned(qm) {
  try {
    const result = await rpcRequest('pin/ls', [qm], { type: 'recursive' });
    return result.Keys[qm];
  } catch (e) {
    return false;
  }
}

const activePinningRequests = new Set();

async function resolveDapp(dapp) {
  try {
    const { codec, hash } = await resolveEns(dapp);
    logger.log(dapp.id, 'resolved', codec, hash);
    const qm =
      codec === 'ipns-ns' || codec === 'ipns'
        ? await resolveQm(hash)
        : codec === 'ipfs-ns'
          ? hash
          : undefined;
    if (qm) {
      Object.assign(dapp, { qm });
    }
    if (qm !== hash) {
      logger.log(dapp.id, 'resolved CID', qm);
    }
    if (!qm) {
      throw new Error(`Codec "${codec}" not supported`);
    }
    if (activePinningRequests.has(qm)) {
      logger.log(dapp.id, 'pinning already in progres...');
      return;
    }
    const isDappPinned = await isPinned(qm);
    if (!isDappPinned) {
      logger.log(dapp.id, 'pinning...', qm);
      activePinningRequests.add(qm);
      await rpcRequest('pin/add', [qm], { progress: true });
      activePinningRequests.delete(qm);
    }
    const bafy = await convertCid(qm);
    Object.assign(dapp, { bafy });

    const url = `${bafy}.ipfs.localhost`;
    Object.assign(dapp, { url });

    logger.log(dapp.id, 'local IPFS host:', url);
  } catch (e) {
    if (dapp.qm) {
      activePinningRequests.delete(dapp.qm);
    }
    logger.error(e);
    return;
  }
}

async function cleanupOldDapps() {
  const hashes = DAPPS.map((dapp) => dapp.qm);
  logger.log('Current DAPPs hashes', hashes);
  if (hashes.length < 1 || hashes.some((hash) => !hash)) {
    // We only want to cleanup when all the dapps aer resolved
    return;
  }
  try {
    const pins = JSON.parse(await rpcRequest('pin/ls', [], { type: 'recursive' }));
    const pinnedHashes = Object.keys(pins.Keys);
    logger.log('Existing IPFS pins', pinnedHashes);
    const toUnpin = pinnedHashes.filter((hash) => !hashes.includes(hash));
    logger.log('Hashes to unpin', toUnpin);
    if (toUnpin.length > 0) {
      for (const hash of toUnpin) {
        logger.log(`Unpinning ${hash}`);
        await rpcRequest('pin/rm', [hash]);
      }
      const pinsAfter = JSON.parse(await rpcRequest('pin/ls', [], { type: 'recursive' }));
      logger.log('Updated IPFS pins', pinsAfter);
      // Clenup the repo
      await rpcRequest('repo/gc');
    }
  } catch (e) {
    // do nothing
  }
}

module.exports = {
  DAPPS,
  resolveEns,
  resolveQm,
  convertCid,
  isPinned,
  resolveDapp,
  cleanupOldDapps,
};
