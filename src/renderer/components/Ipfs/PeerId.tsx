import React, { useEffect, useState } from 'react';
import type { IpcRendererEvent } from 'electron';

const { ipcRenderer } = window.electron;

const IPFSPeerId: React.FC = () => {
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const updateId = () => {
      ipcRenderer.send('ipfs-id');
    };

    const handleIdResult = (event: IpcRendererEvent, result: string) => {
      setId(JSON.parse(result).ID);
    };

    ipcRenderer.on('ipfs-id-result', handleIdResult);
    updateId(); // Fetch id on initial render
    const intervalId = setInterval(updateId, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up interval on unmount
      ipcRenderer.removeListener('ipfs-id-result', handleIdResult);
    };
  }, []);

  return <>{id}</>;
};

export default IPFSPeerId;
