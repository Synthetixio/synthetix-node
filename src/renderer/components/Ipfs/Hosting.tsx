import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.electron;

const Hosting: React.FC = () => {
  const [repoStat, setRepoStat] = useState<string>('');

  useEffect(() => {
    const updateRepoStat = () => {
      ipcRenderer.send('ipfs-repo-stat');
    };

    const handleRepoStatResult = (
      event: Electron.IpcRendererEvent,
      result: string
    ) => {
      const numBytes = parseInt(result.split('\n')[1].split(':')[1].trim());
      const numMegabytes = (numBytes / 1000000).toFixed();
      setRepoStat(numMegabytes.toString());
    };

    ipcRenderer.on('ipfs-repo-stat-result', handleRepoStatResult);
    updateRepoStat(); // Fetch repoStat on initial render
    const intervalId = setInterval(updateRepoStat, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up interval on unmount
      ipcRenderer.removeListener('ipfs-repo-stat-result', handleRepoStatResult);
    };
  }, []);

  return <>{repoStat}MB</>;
};

export default Hosting;
