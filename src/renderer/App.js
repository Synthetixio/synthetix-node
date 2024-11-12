const { Box, Text, Button } = require('@chakra-ui/react');
const React = require('react');
const { Dapps } = require('./DApps');
const { Ipfs } = require('./Ipfs');
const { AuthConnect } = require('./AuthConnect');
const { createAppKit } = require('@reown/appkit/react');
const { optimismSepolia } = require('@reown/appkit/networks');
const { Routes, Route, useLocation, useNavigate } = require('react-router-dom');

createAppKit({
  networks: [optimismSepolia],
  metadata: {
    name: 'Synthetix Node',
    description: 'Synthetix Node',
    url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  },
  projectId: process.env.PROJECTID || window.env.PROJECTID,
  features: {
    analytics: true,
  },
});

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleButtonClick = () => {
    navigate(location.pathname === '/auth' ? '/' : '/auth');
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Button colorScheme="teal" variant="outline" onClick={handleButtonClick}>
        {location.pathname === '/auth' ? 'Go to Main Page' : 'Go to Auth Page'}
      </Button>
      <Routes>
        <Route
          path="/"
          element={
            <>
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
