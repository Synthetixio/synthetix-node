import {
  Box,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Heading,
  Text,
  Icon,
  Code,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import PeersCount from './PeersCount';

export default function Ipfs() {
  return (
    <Box pt="3">
      <Tabs variant="soft-rounded" colorScheme="blue" isLazy size="xs">
        <TabList display="flex" justifyContent="center">
          <Tab fontSize="xs" px="2" mx="2" _focus={{ boxShadow: 'none' }}>
            Status
          </Tab>
          <Tab fontSize="xs" px="2" mx="2" _focus={{ boxShadow: 'none' }}>
            Logs
          </Tab>
        </TabList>
        <TabPanels flex="1">
          <TabPanel display="flex" flexDirection="column" flex="1">
            <Box flex="1">
              <Heading mb="3" size="md">
                <Box
                  display="inline-block"
                  mr="1.5"
                  textColor="green.400"
                  transform="translateY(-2px)"
                >
                  <Icon viewBox="0 0 200 200">
                    <path
                      fill="currentColor"
                      d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                    />
                  </Icon>
                </Box>
                IPFS Node running at localhost:5001
              </Heading>
              <Stack direction="row" spacing={6} justifyContent="center" mb="3">
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
                  <StatNumber>23MiB</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel mb="0" opacity="0.8">
                    Outgoing
                  </StatLabel>
                  <StatNumber>34 KiB/s</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel mb="0" opacity="0.8">
                    Incoming
                  </StatLabel>
                  <StatNumber>43 KiB/s</StatNumber>
                </Stat>
              </Stack>
              <Box mb="2">
                <Text
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="1px"
                  opacity="0.8"
                >
                  Your Peer ID
                </Text>
                <Code>
                  dfg4GSSb537F3b7VG236hGdfGSNYefgs43tumjvsRTyj3b78n6sd
                </Code>
              </Box>
              <Box>
                <Text
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="1px"
                  opacity="0.8"
                >
                  Synthetix Cluster ID
                </Text>
                <Code>
                  12D3KooWceEkc6t7kmHg5bidQ3UybG52tScQzWvZ8bxpA7Qeb87n
                </Code>
              </Box>
            </Box>
          </TabPanel>
          <TabPanel display="flex" flexDirection="column" flex="1">
            <Box flex="1">
              Can we just spit out some logs into prism.js here for
              troubleshooting?
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
