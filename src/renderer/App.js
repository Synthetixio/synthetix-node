import { Box, Text } from '@chakra-ui/react';
import React from 'react';
import { Dapps } from './DApps';
import { Ipfs } from './Ipfs';

export default function App() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Box px="5" flex="1" overflowY="auto">
        <Ipfs />
      </Box>
      <Box p="1">
        <Dapps />
      </Box>

      <Box background="whiteAlpha.100" p="1">
        <Text align="center" opacity="0.5" fontSize="xs">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}
