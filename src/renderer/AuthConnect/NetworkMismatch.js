const React = require('react');
const {
  Box,
  Flex,
  Button,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} = require('@chakra-ui/react');
const { useNavigate } = require('react-router-dom');
const { optimismSepolia } = require('@reown/appkit/networks');
const { useAppKitNetwork, useDisconnect } = require('@reown/appkit/react');

function NetworkMismatch() {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useAppKitNetwork();

  return (
    <>
      <Box as="header" width="100%" borderBottomWidth="1px" p={3}>
        <Flex maxW="1200px" mx="auto" align="center" justify="space-between">
          <Box>Synthetix Node</Box>
          <Stack direction="row" spacing={4} align="center">
            <Button colorScheme="teal" variant="outline" onClick={() => navigate('/')}>
              Go to Main Page
            </Button>
            <Button colorScheme="teal" variant="outline" onClick={disconnect}>
              Disconnect
            </Button>
          </Stack>
        </Flex>
      </Box>

      <Box minW="600px" mx="auto" mt="4">
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p="6">
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => switchNetwork(optimismSepolia)}
          >
            Change chain to OP Sepolia
          </Button>
          <Alert status="warning" mt="4" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Network mismatch detected.</AlertTitle>
            <AlertDescription>Please switch to OP Sepolia.</AlertDescription>
          </Alert>
        </Box>
      </Box>
    </>
  );
}

module.exports = { NetworkMismatch };
