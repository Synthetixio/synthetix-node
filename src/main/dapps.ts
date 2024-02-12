import logger from 'electron-log';
import fetch from 'node-fetch';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { namehash, normalize } from 'viem/ens';
// @ts-ignore
import * as contentHash from '@ensdomains/content-hash';
import { ipfs } from './ipfs';
import { getPid } from './pid';
import { DappType } from '../config';

Object.assign(global, { fetch });

export const DAPPS: DappType[] = [];

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const resolverAbi = [
  {
    constant: true,
    inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    name: 'contenthash',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export async function resolveEns(dapp: DappType): Promise<{ codec: string; hash: string }> {
  if (dapp.ipns) {
    return {
      codec: 'ipns-ns',
      hash: dapp.ipns,
    };
  }
  if (!dapp.ens) {
    throw new Error('Neither ipns nor ens was set, cannot resolve');
  }
  const name = normalize(dapp.ens);
  const resolverAddress = await client.getEnsResolver({ name });
  const hash = await client.readContract({
    address: resolverAddress,
    abi: resolverAbi,
    functionName: 'contenthash',
    args: [namehash(name)],
  });
  const codec = contentHash.getCodec(hash);
  return {
    codec,
    hash: contentHash.decode(hash),
  };
}

export async function resolveQm(ipns: string): Promise<string> {
  const ipfsPath = await ipfs(`resolve /ipns/${ipns}`);
  const qm = ipfsPath.slice(6); // remove /ipfs/
  return qm; // Qm
}

export async function convertCid(qm: string): Promise<string> {
  return await ipfs(`cid base32 ${qm}`);
}

export async function isPinned(qm: string): Promise<boolean> {
  try {
    const result = await ipfs(`pin ls --type recursive ${qm}`);
    return result.includes(qm);
  } catch (e) {
    return false;
  }
}

export async function resolveDapp(dapp: DappType): Promise<void> {
  try {
    const { codec, hash } = await resolveEns(dapp);
    logger.log(dapp.id, 'resolved', codec, hash);
    const qm = codec === 'ipns-ns' ? await resolveQm(hash) : codec === 'ipfs-ns' ? hash : undefined;
    if (qm) {
      Object.assign(dapp, { qm });
    }
    if (qm !== hash) {
      logger.log(dapp.id, 'resolved CID', qm);
    }
    if (!qm) {
      throw new Error(`Codec "${codec}" not supported`);
    }
    const isWin = process.platform === 'win32';
    if (await getPid(`${isWin ? 'ipfs' : ''} pin add --progress ${qm}`)) {
      logger.log(dapp.id, 'pinning already in progres...');
      return;
    }
    const isDappPinned = await isPinned(qm);
    if (!isDappPinned) {
      logger.log(dapp.id, 'pinning...', qm);
      await ipfs(`pin add --progress ${qm}`);
    }
    const bafy = await convertCid(qm);
    Object.assign(dapp, { bafy });

    const url = `${bafy}.ipfs.localhost`;
    Object.assign(dapp, { url });

    logger.log(dapp.id, 'local IPFS host:', url);
  } catch (e) {
    logger.error(e);
    return;
  }
}

export async function cleanupOldDapps() {
  const hashes = DAPPS.map((dapp) => dapp.qm);
  logger.log('Current DAPPs hashes', hashes);
  if (hashes.length < 1 || hashes.some((hash) => !hash)) {
    // We only want to cleanup when all the dapps aer resolved
    return;
  }
  try {
    const pins = JSON.parse(await ipfs('pin ls --enc=json --type=recursive'));
    const pinnedHashes = Object.keys(pins.Keys);
    logger.log('Existing IPFS pins', pinnedHashes);
    const toUnpin = pinnedHashes.filter((hash) => !hashes.includes(hash));
    logger.log('Hashes to unpin', toUnpin);
    if (toUnpin.length > 0) {
      for (const hash of toUnpin) {
        logger.log(`Unpinning ${hash}`);
        await ipfs(`pin rm ${hash}`);
      }
      const pinsAfter = JSON.parse(await ipfs('pin ls --enc=json --type=recursive'));
      logger.log('Updated IPFS pins', pinsAfter);
      // Clenup the repo
      await ipfs('repo gc');
    }
  } catch (e) {
    // do nothing
  }
}
