import { Box, Heading, Text } from '@chakra-ui/react';
import { Ipfs } from './components/Ipfs';

export default function App() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Box background="blackAlpha.300" px="3" py="2" display="flex">
        <Heading size="md">Synthetix IPFS Node</Heading>
      </Box>
      <Box px="3" flex="1" overflowY="auto">
        <Ipfs />
      </Box>
      <Box background="blackAlpha.300" p="1">
        <Text align="center" opacity="0.5" fontSize="sm">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}
