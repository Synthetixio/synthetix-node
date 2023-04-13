/* eslint-disable no-console */
// @ts-nocheck

import { ethers } from 'ethers';
import { mainnet } from '@wagmi/chains';
import { ipfs } from './ipfs';

export async function resolveEns(ens: string): string {
  const provider = new ethers.providers.JsonRpcProvider(
    mainnet.rpcUrls.public.http[0]
  );
  const resolver = await provider.getResolver(ens);
  const ipnsUrl = await resolver.getContentHash();
  return ipnsUrl.slice(7); // remove ipns://
}

export async function resolveQm(ipns: string): string {
  const ipfsPath = await ipfs(`resolve /ipns/${ipns}`);
  const qm = ipfsPath.slice(6); // remove /ipfs/
  return qm; // Qm
}

export async function convertCid(qm: string): string {
  return await ipfs(`cid base32 ${qm}`);
}

export async function isPinned(qm: string): boolean {
  try {
    const result = await ipfs(`pin ls --type recursive ${qm}`);
    return result.includes(qm);
  } catch (e) {
    return false;
  }
}

export async function getDappUrl(ens: string): Promise<string> {
  try {
    const ipns = await resolveEns(ens);
    const qm = await resolveQm(ipns);
    console.log('DApp resolved', ens, 'IPNS:', ipns, 'CID:', qm);
    const isKwentaPinned = await isPinned(qm);
    if (!isKwentaPinned) {
      console.log('Pinning...', ens);
      await ipfs(`pin add --progress ${qm}`);
    }
    const bafy = await convertCid(qm);
    const url = `http://${bafy}.ipfs.localhost:8080`;
    return url;
  } catch (e) {
    console.error(e);
    return '';
  }
}
