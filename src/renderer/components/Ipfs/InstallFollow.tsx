import { Button, Spinner } from '@chakra-ui/react';
import React, { useState } from 'react';

const { ipcRenderer } = window.electron;

const InstallFollow: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleInstallFollow = () => {
    setLoading(true);
    ipcRenderer.send('install-follow');
  };

  const handleInstallFollowResult = () => {
    setLoading(false);
  };

  ipcRenderer.on('install-follow-result', handleInstallFollowResult);

  return (
    <Button
      colorScheme="green"
      transform="translateY(-2px)"
      ml="2"
      size="xs"
      onClick={handleInstallFollow}
      isLoading={loading}
    >
      {loading ? <Spinner /> : 'Start Following'}
    </Button>
  );
};

export default InstallFollow;
