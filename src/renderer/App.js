const { Box, Text } = require('@chakra-ui/react');
const React = require('react');
const { Dapps } = require('./DApps');
const { Ipfs } = require('./Ipfs');

function App() {
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

module.exports = App;
