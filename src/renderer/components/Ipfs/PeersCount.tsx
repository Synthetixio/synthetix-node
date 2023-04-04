import React, { useEffect, useState } from 'react';
import type { IpcRendererEvent } from 'electron';

const { ipcRenderer } = window.electron;

const IPFSPeers: React.FC = () => {
  const [peers, setPeers] = useState<string>('');

  useEffect(() => {
    const updatePeers = () => {
      ipcRenderer.send('ipfs-peers');
    };

    const handlePeersResult = (event: IpcRendererEvent, result: string) => {
      setPeers(result);
    };

    ipcRenderer.on('ipfs-peers-result', handlePeersResult);
    updatePeers(); // Fetch peers on initial render
    const intervalId = setInterval(updatePeers, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up interval on unmount
      ipcRenderer.removeListener('ipfs-peers-result', handlePeersResult);
    };
  }, []);

  return <>{peers.split('\n').length}</>;
};

export default IPFSPeers;
