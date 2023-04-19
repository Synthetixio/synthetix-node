import logger from 'electron-log';
import fetch from 'node-fetch';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { namehash, normalize } from 'viem/ens';
// @ts-ignore
import * as contentHash from '@ensdomains/content-hash';
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
  ens: string
): Promise<{ codec: string; hash: string }> {
  const name = normalize(ens);
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

export async function getDappHost(ens: string): Promise<string | undefined> {
  try {
    const { codec, hash } = await resolveEns(ens);
    logger.log(ens, 'resolved', codec, hash);
    const qm =
      codec === 'ipns-ns'
        ? await resolveQm(hash)
        : codec === 'ipfs-ns'
        ? hash
        : undefined;
    if (!qm) {
      throw new Error(`Codec "${codec}" not supported`);
    }
    if (await getPid(`pin add --progress ${qm}`)) {
      logger.log(ens, 'pinning already in progres...');
      return undefined;
    }
    const isDappPinned = await isPinned(qm);
    if (!isDappPinned) {
      logger.log(ens, 'pinning...', qm);
      await ipfs(`pin add --progress ${qm}`);
    }
    const bafy = await convertCid(qm);
    const url = `${bafy}.ipfs.localhost`;
    logger.log(ens, 'local IPFS host:', url);
    return url;
  } catch (e) {
    logger.error(e);
    return undefined;
  }
}
