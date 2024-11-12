const { Flex, Box, Text, Button } = require('@chakra-ui/react');
const React = require('react');
const { Dapps } = require('./DApps');
const { Ipfs } = require('./Ipfs');
const { AuthConnect } = require('./AuthConnect');
const { createAppKit } = require('@reown/appkit/react');
const { optimismSepolia } = require('@reown/appkit/networks');
const { Routes, Route, useNavigate } = require('react-router-dom');

createAppKit({
  networks: [optimismSepolia],
  metadata: {
    name: 'Synthetix Node',
    description: 'Synthetix Node',
  },
  projectId: process.env.PROJECTID || window.env.PROJECTID,
  features: {
    analytics: true,
  },
});

function App() {
  const navigate = useNavigate();

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Box as="header" width="100%" borderBottomWidth="1px" p={3}>
                <Flex maxW="1200px" mx="auto" align="center" justify="space-between">
                  <Box>Synthetix Node</Box>
                  <Button colorScheme="teal" variant="outline" onClick={() => navigate('/auth')}>
                    Go to Auth Page
                  </Button>
                </Flex>
              </Box>
              <Box px="5" flex="1" overflowY="auto">
                <Ipfs />
              </Box>
              <Box p="1">
                <Dapps />
              </Box>
            </>
          }
        />
        <Route path="/auth" element={<AuthConnect />} />
      </Routes>

      <Box background="whiteAlpha.100" p="1" mt="auto">
        <Text align="center" opacity="0.5" fontSize="xs">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}

module.exports = App;
