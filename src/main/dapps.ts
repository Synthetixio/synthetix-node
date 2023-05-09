import logger from 'electron-log';
import fetch from 'node-fetch';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { namehash, normalize } from 'viem/ens';
// @ts-ignore
import * as contentHash from '@ensdomains/content-hash';
import { DappType } from '../dapps';
import { ipfs } from './ipfs';
import { getPid } from './pid';

Object.assign(global, { fetch });

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

export async function resolveEns(
  dapp: DappType
): Promise<{ codec: string; hash: string }> {
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

export async function getDappHost(dapp: DappType): Promise<string | undefined> {
  try {
    const { codec, hash } = await resolveEns(dapp);
    logger.log(dapp.id, 'resolved', codec, hash);
    const qm =
      codec === 'ipns-ns'
        ? await resolveQm(hash)
        : codec === 'ipfs-ns'
        ? hash
        : undefined;
    if (qm !== hash) {
      logger.log(dapp.id, 'resolved CID', qm);
    }
    if (!qm) {
      throw new Error(`Codec "${codec}" not supported`);
    }
    if (await getPid(`pin add --progress ${qm}`)) {
      logger.log(dapp.id, 'pinning already in progres...');
      return undefined;
    }
    const isDappPinned = await isPinned(qm);
    if (!isDappPinned) {
      logger.log(dapp.id, 'pinning...', qm);
      await ipfs(`pin add --progress ${qm}`);
    }
    const bafy = await convertCid(qm);
    const url = `${bafy}.ipfs.localhost`;
    logger.log(dapp.id, 'local IPFS host:', url);
    return url;
  } catch (e) {
    logger.error(e);
    return undefined;
  }
}
