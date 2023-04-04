import { Box, Icon, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import type { IpcRendererEvent } from 'electron';
import InstallFollow from './InstallFollow';
import InstallIpfs from './InstallIpfs';

const { ipcRenderer } = window.electron;

const Status: React.FC = () => {
  const [status, setStatus] = useState<string>('red');

  useEffect(() => {
    const updateId = () => {
      ipcRenderer.send('ipfs-id');
    };

    const handleIdResult = (event: IpcRendererEvent, result: string) => {
      try {
        const id = JSON.parse(result).ID;
        if (id) {
          setStatus('yellow');
          ipcRenderer.send('ipfs-follow-state');
        }
      } catch (error) {
        console.error('Error parsing IPFS ID JSON', error);
      }
    };

    const handleFollowStateResult = (
      event: IpcRendererEvent,
      result: string
    ) => {
      if (result.length > 0) {
        setStatus('green');
      }
    };

    ipcRenderer.on('ipfs-id-result', handleIdResult);
    ipcRenderer.on('ipfs-follow-state-result', handleFollowStateResult);

    updateId(); // Fetch id on initial render
    const intervalId = setInterval(updateId, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(intervalId); // Clean up interval on unmount
      ipcRenderer.removeListener('ipfs-id-result', handleIdResult);
      ipcRenderer.removeListener(
        'ipfs-follow-state-result',
        handleFollowStateResult
      );
    };
  }, []);

  const renderStatus = () => {
    switch (status) {
      case 'green':
        return (
          <>
            <Box
              display="inline-block"
              mr="1"
              textColor="green.400"
              transform="translateY(-1px)"
            >
              <Icon viewBox="0 0 200 200">
                <path
                  fill="currentColor"
                  d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                />
              </Icon>
            </Box>
            <Text display="inline-block">
              Your IPFS node is following the Synthetix Ecosystem cluster
            </Text>
          </>
        );
      case 'yellow':
        return (
          <>
            <Box
              display="inline-block"
              mr="1"
              textColor="yellow.400"
              transform="translateY(-1px)"
            >
              <Icon viewBox="0 0 200 200">
                <path
                  fill="currentColor"
                  d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                />
              </Icon>
            </Box>
            <Text display="inline-block">
              Your IPFS node is not following the cluster <InstallFollow />
            </Text>
          </>
        );
      case 'red':
      default:
        return (
          <>
            {' '}
            <Box
              display="inline-block"
              mr="1"
              textColor="red.400"
              transform="translateY(-1px)"
            >
              <Icon viewBox="0 0 200 200">
                <path
                  fill="currentColor"
                  d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                />
              </Icon>
            </Box>
            <Text display="inline-block">
              Your IPFS node is not running <InstallIpfs />
            </Text>
          </>
        );
    }
  };

  return <>{renderStatus()}</>;
};

export default Status;
