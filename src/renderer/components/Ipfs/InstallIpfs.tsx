import { Button, Spinner } from '@chakra-ui/react';
import React, { useState } from 'react';

const { ipcRenderer } = window.electron;

const InstallIpfs: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleInstallIpfs = () => {
    setLoading(true);
    ipcRenderer.send('install-ipfs');
  };

  const handleInstallIpfsResult = () => {
    setLoading(false);
  };

  ipcRenderer.on('install-ipfs-result', handleInstallIpfsResult);

  return (
    <Button
      colorScheme="green"
      transform="translateY(-2px)"
      ml="2"
      size="xs"
      onClick={handleInstallIpfs}
      isLoading={loading}
    >
      {loading ? <Spinner /> : 'Start IPFS'}
    </Button>
  );
};

export default InstallIpfs;
