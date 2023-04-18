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
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { usePeerId } from './usePeerId';
import { usePeers } from './usePeers';
import { useRateIn } from './useRateIn';
import { useRateOut } from './useRateOut';
import { useHostingSize } from './useHostingSize';
import { useIsIpfsRunning } from './useIsIpfsRunning';
import { useIsIpfsInstalled } from './useIsIpfsInstalled';
import { useIsFollowerInstalled } from './useIsFollowerInstalled';
import { useFollowerInfo } from './useFollowerInfo';
import { SYNTHETIX_IPNS } from '../../const';

function handleCopy(text: string) {
  if (text) {
    navigator.clipboard.writeText(text);
  }
}

function StatusIcon(props: any) {
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

export function Ipfs() {
  const { data: isIpfsInstalled } = useIsIpfsInstalled();
  const { data: isIpfsRunning } = useIsIpfsRunning();
  const { data: isFollowerInstalled } = useIsFollowerInstalled();
  const { data: peers } = usePeers();
  const { data: peerId } = usePeerId();
  const { data: followerInfo } = useFollowerInfo();
  const rateIn = useRateIn();
  const rateOut = useRateOut();
  const hostingSize = useHostingSize();

  // eslint-disable-next-line no-console
  console.log({
    isIpfsInstalled,
    isIpfsRunning,
    isFollowerInstalled,
    isFollowerRunning: followerInfo.cluster,
    peers,
    peerId,
    rateIn,
    rateOut,
    hostingSize,
  });

  return (
    <Box pt="3">
      <Box flex="1" p="0">
        <Stack direction="row" spacing={6} justifyContent="center" mb="2">
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
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Peers
            </StatLabel>
            <StatNumber>{peers ? peers : '-'}</StatNumber>
          </Stat>
        </Stack>
        <Box bg="whiteAlpha.200" pt="4" px="4" pb="4" mb="3">
          <Heading mb="3" size="sm">
            {isIpfsInstalled && isIpfsRunning ? (
              <Text as="span" whiteSpace="nowrap">
                <StatusIcon textColor="green.400" />
                <Text display="inline-block">Your IPFS node is running</Text>
              </Text>
            ) : null}

            {isIpfsInstalled && !isIpfsRunning ? (
              <Text as="span" whiteSpace="nowrap">
                <Spinner size="xs" mr="2" />
                <Text display="inline-block">
                  Your IPFS node is starting...
                </Text>
              </Text>
            ) : null}

            {!isIpfsInstalled ? (
              <Text as="span" whiteSpace="nowrap">
                <Spinner size="xs" mr="2" />
                <Text display="inline-block">IPFS node is installing...</Text>
              </Text>
            ) : null}
          </Heading>

          <Heading size="sm">
            {isFollowerInstalled && followerInfo.cluster ? (
              <Text as="span" whiteSpace="nowrap">
                <StatusIcon textColor="green.400" />
                <Text display="inline-block">
                  You are connected to the Synthetix Cluster
                </Text>
              </Text>
            ) : null}

            {isFollowerInstalled && !followerInfo.cluster ? (
              <Text as="span" whiteSpace="nowrap">
                <Spinner size="xs" mr="2" />
                <Text display="inline-block">
                  Connecting to the Synthetix Cluster...
                </Text>
              </Text>
            ) : null}

            {!isFollowerInstalled ? (
              <Text as="span" whiteSpace="nowrap">
                <Spinner size="xs" mr="2" />
                <Text display="inline-block">
                  Synthetix Cluster Connector is installing...
                </Text>
              </Text>
            ) : null}
          </Heading>
        </Box>
        <Box mb="3">
          <Text
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="1px"
            opacity="0.8"
            mb="1"
          >
            Your Peer ID
          </Text>
          <Box display="flex" alignItems="center">
            <Code>
              {peerId ? peerId : 'CONNECT YOUR IPFS NODE TO GENERATE A PEER ID'}
            </Code>
            {peerId && (
              <CopyIcon
                opacity="0.8"
                ml="2"
                cursor="pointer"
                onClick={() => handleCopy(peerId)}
              />
            )}
          </Box>
        </Box>
        <Box>
          <Text
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="1px"
            opacity="0.8"
            mb="1"
          >
            Synthetix Cluster IPNS
          </Text>
          <Box display="flex" alignItems="center">
            <Code fontSize="sm">{SYNTHETIX_IPNS}</Code>
            {SYNTHETIX_IPNS && (
              <CopyIcon
                opacity="0.8"
                ml="2"
                cursor="pointer"
                onClick={() => handleCopy(SYNTHETIX_IPNS)}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
