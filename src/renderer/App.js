const { Box, Text, Button } = require('@chakra-ui/react');
const React = require('react');
const { Dapps } = require('./DApps');
const { Ipfs } = require('./Ipfs');
const { AuthConnect } = require('./AuthConnect');
const { createAppKit } = require('@reown/appkit/react');
const { optimismSepolia, mainnet } = require('@reown/appkit/networks');

createAppKit({
  networks: [optimismSepolia, mainnet],
  metadata: {
    name: 'synthetix-node-test-1',
    description: 'Synthetix Node',
    url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  },
  projectId: 'projectId',
  features: {
    analytics: true,
  },
});

function App() {
  const [isAuthPage, setIsAuthPage] = React.useState(true);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Button onClick={() => setIsAuthPage((prev) => !prev)}>
        {isAuthPage ? 'Go to Main Page' : 'Go to Auth Page'}
      </Button>

      {isAuthPage ? (
        <AuthConnect />
      ) : (
        <>
          <Box px="5" flex="1" overflowY="auto">
            <Ipfs />
          </Box>
          <Box p="1">
            <Dapps />
          </Box>
        </>
      )}

      <Box background="whiteAlpha.100" p="1" mt="auto">
        <Text align="center" opacity="0.5" fontSize="xs">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}

module.exports = App;
