import {
  Box,
  Code,
  Heading,
  Icon,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Button,
} from '@chakra-ui/react';
import { usePeerId } from './usePeerId';
import { usePeers } from './usePeers';
import { useRateIn } from './useRateIn';
import { useRateOut } from './useRateOut';
import { useHostingSize } from './useHostingSize';
import { useIsRunning } from './useIsRunning';
import { useIsInstalled } from './useIsInstalled';

function StatusIcon(props) {
  return (
    <Box display="inline-block" mr="1" transform="translateY(-1px)" {...props}>
      <Icon viewBox="0 0 200 200">
        <path
          fill="currentColor"
          d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
        />
      </Icon>
    </Box>
  );
}

import { useMutation } from '@tanstack/react-query';

const { ipcRenderer } = window?.electron || {};

const ipns = 'k51qzi5uqu5dmdzyb1begj16z2v5btbyzo1lnkdph0kn84o9gmc2uokpi4w54c';

export function useInstallIpfs() {
  return useMutation({
    mutationKey: ['ipfs'],
    mutationFn: () => ipcRenderer.invoke('install-ipfs'),
    enabled: Boolean(ipcRenderer),
  });
}

export function useRunIpfs() {
  return useMutation({
    mutationKey: ['ipfs'],
    mutationFn: () => ipcRenderer.invoke('run-ipfs'),
    enabled: Boolean(ipcRenderer),
  });
}

export function Ipfs() {
  const { data: isInstalled, isLoading: isInstalledLoading } = useIsInstalled();
  const { data: isRunning, isLoading: isRunningLoading } = useIsRunning();
  const { data: peers } = usePeers();
  const { data: peerId } = usePeerId();
  const rateIn = useRateIn();
  const rateOut = useRateOut();
  const hostingSize = useHostingSize();
  console.log({
    isInstalled,
    isRunning,
    peers,
    peerId,
    rateIn,
    rateOut,
    hostingSize,
  });

  const { mutate: onInstallIpfs, isLoading: isInstallIpfsLoading } =
    useInstallIpfs();

  const { mutate: onRunIpfs, isLoading: isRunIpfsLoading } = useRunIpfs();

  return (
    <Box pt="5">
      <Box flex="1" p="0">
        <Heading mb="5" size="sm">
          {isInstalledLoading || isRunningLoading ? (
            <>
              Checking IPFS status... <Spinner />
            </>
          ) : (
            <>
              {isRunning ? (
                <>
                  <StatusIcon textColor="green.400" />
                  <Text display="inline-block">
                    {/*Your IPFS node is following the Synthetix Ecosystem cluster*/}
                    Your IPFS node is running
                  </Text>
                </>
              ) : (
                <>
                  {isInstalled ? (
                    <>
                      <StatusIcon textColor="yellow.400" />
                      <Text display="inline-block">
                        Your IPFS node is not running
                        <Button
                          colorScheme="yellow"
                          transform="translateY(-2px)"
                          ml="2"
                          size="xs"
                          onClick={onRunIpfs}
                          isLoading={isRunIpfsLoading}
                        >
                          Run IPFS node
                          {isRunIpfsLoading ? <Spinner /> : null}
                        </Button>
                      </Text>
                    </>
                  ) : (
                    <>
                      <StatusIcon textColor="red.400" />
                      <Text display="inline-block">
                        Your IPFS node is not installed
                        <Button
                          colorScheme="green"
                          transform="translateY(-2px)"
                          ml="2"
                          size="xs"
                          onClick={onInstallIpfs}
                          isLoading={isInstallIpfsLoading}
                        >
                          Install IPFS
                          {isInstallIpfsLoading ? <Spinner /> : null}
                        </Button>
                      </Text>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Heading>
        <Stack direction="row" spacing={6} justifyContent="center" mb="5">
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Peers
            </StatLabel>
            <StatNumber>{peers}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Hosting
            </StatLabel>
            <StatNumber>
              {hostingSize ? `${hostingSize.toFixed(2)} Mb` : '-'}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Outgoing
            </StatLabel>
            <StatNumber>{rateOut ? rateOut : '-'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Incoming
            </StatLabel>
            <StatNumber>{rateIn ? rateIn : '-'}</StatNumber>
          </Stat>
        </Stack>
        <Box
          mb="5"
          cursor={peerId ? 'context-menu' : 'default'}
          onClick={() =>
            peerId ? navigator.clipboard.writeText(peerId) : null
          }
        >
          <Text
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="1px"
            opacity="0.8"
          >
            Your Peer ID
          </Text>
          <Code>{peerId ? peerId : '~'}</Code>
        </Box>
        <Box>
          <Text
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="1px"
            opacity="0.8"
          >
            Synthetix Cluster IPNS
          </Text>
          <Code
            fontSize="xs"
            cursor={ipns ? 'context-menu' : 'default'}
            onClick={() => (ipns ? navigator.clipboard.writeText(ipns) : null)}
          >
            {ipns}
          </Code>
        </Box>
      </Box>
    </Box>
  );
}
