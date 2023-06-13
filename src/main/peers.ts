import logger from 'electron-log';
import fetch from 'node-fetch';

Object.assign(global, { fetch });

export type Peer = {
  id: string;
  version: string;
};

export async function fetchPeers(): Promise<Peer[]> {
  try {
    const response = await fetch('https://ipfs.synthetix.io/dash/api');
    if (response.ok) {
      const state = (await response.json()) as { peers: Peer[] };
      return state.peers.sort((a, b) => a.id.localeCompare(b.id));
    }
    return [];
  } catch (e) {
    logger.error(e);
    return [];
  }
}
