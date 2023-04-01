import {
  Box,
  Heading,
  Text,
  Code,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import PeersCount from './PeersCount';
import PeerId from './PeerId';
import Hosting from './Hosting';
import RateIn from './RateIn';
import RateOut from './RateOut';
import Status from './Status';

export default function Ipfs() {
  return (
    <Box pt="5">
      <Box flex="1" p="0">
        <Heading mb="5" size="sm">
          <Status />
        </Heading>
        <Stack direction="row" spacing={6} justifyContent="center" mb="5">
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Peers
            </StatLabel>
            <StatNumber>
              <PeersCount />
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Hosting
            </StatLabel>
            <StatNumber>
              <Hosting />
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Outgoing
            </StatLabel>
            <StatNumber>
              <RateOut />
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel mb="0" opacity="0.8">
              Incoming
            </StatLabel>
            <StatNumber>
              <RateIn />
            </StatNumber>
          </Stat>
        </Stack>
        <Box mb="5">
          <Text
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="1px"
            opacity="0.8"
          >
            Your Peer ID
          </Text>
          <Code>
            <PeerId />
          </Code>
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
          <Code fontSize="xs">
            k51qzi5uqu5dmdzyb1begj16z2v5btbyzo1lnkdph0kn84o9gmc2uokpi4w54c
          </Code>
        </Box>
      </Box>
    </Box>
  );
}
