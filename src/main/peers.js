import logger from 'electron-log';

Object.assign(global, { fetch });

export async function fetchPeers() {
  try {
    const response = await fetch('https://ipfs.synthetix.io/dash/api');
    if (response.ok) {
      const state = await response.json();
      return state.peers.sort((a, b) => a.id.localeCompare(b.id));
    }
    return [];
  } catch (e) {
    logger.error(e);
    return [];
  }
}
