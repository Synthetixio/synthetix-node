import React, { useEffect, useState } from 'react';
import type { IpcRendererEvent } from 'electron';

const { ipcRenderer } = window.electron;

const RateIn: React.FC = () => {
  const [statsBw, setStatsBw] = useState<string>('');

  useEffect(() => {
    const updateRepoStat = () => {
      ipcRenderer.send('ipfs-stats-bw');
    };

    const handleRepoStatResult = (event: IpcRendererEvent, result: string) => {
      const rateIn = result.split('\n')[3].split(':')[1].trim();
      setStatsBw(rateIn);
    };

    ipcRenderer.on('ipfs-stats-bw-result', handleRepoStatResult);
    updateRepoStat(); // Fetch statsBw on initial render
    const intervalId = setInterval(updateRepoStat, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up interval on unmount
      ipcRenderer.removeListener('ipfs-stats-bw-result', handleRepoStatResult);
    };
  }, []);

  return <>{statsBw}</>;
};

export default RateIn;
