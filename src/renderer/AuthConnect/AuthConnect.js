const React = require('react');
const { useMutation } = require('@tanstack/react-query');
const {
  useAppKitAccount,
  useDisconnect,
  useAppKit,
  useAppKitProvider,
} = require('@reown/appkit/react');
const {
  Spinner,
  Box,
  Flex,
  Button,
  Stack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} = require('@chakra-ui/react');
const { usePermissions } = require('./usePermissions');
const { AccessControl } = require('./AccessControl');
const { getApiUrl, saveToken, removeToken, restoreToken } = require('./utils');
const { BrowserProvider } = require('ethers');

const makeUnauthenticatedRequest = async (endpoint, data) => {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  throw new Error('Network response was not ok');
};

function AuthConnect() {
  const [token, setToken] = React.useState();
  const [isSigning, setIsSigning] = React.useState(false);
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider('eip155');
  const permissions = usePermissions();

  React.useEffect(() => {
    const restoredToken = restoreToken({ walletAddress });
    if (restoredToken) {
      setToken(restoredToken);
    }
  }, [walletAddress]);

  const signupMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('signup', data),
    onSuccess: async ({ nonce }) => {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      setIsSigning(true);
      const signedMessage = await signer?.signMessage(nonce);
      setIsSigning(false);
      if (signedMessage) {
        verificationMutation.mutate({ nonce, signedMessage });
      }
    },
  });

  const verificationMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('verify', data),
    onSuccess: ({ token }) => {
      saveToken({ walletAddress, token });
      setToken(token);
    },
  });

  const logout = () => {
    removeToken(walletAddress);
    setToken(null);
  };

  return (
    <Box minW="600px" mx="auto" mt="4">
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p="6" boxShadow="lg">
        <Flex
          minH="60px"
          py={2}
          px={4}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align="center"
          justify="flex-end"
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <Stack direction="row" spacing={4}>
            <Button colorScheme="blue" onClick={() => open({ view: 'Networks' })}>
              Open Network Modal
            </Button>
            {isConnected && token ? (
              <Button colorScheme="red" onClick={logout}>
                Log Out
              </Button>
            ) : null}
            {isConnected && !token ? (
              <>
                <Button
                  colorScheme="green"
                  onClick={() => signupMutation.mutate({ walletAddress })}
                >
                  Log In
                </Button>
                <Button variant="outline" colorScheme="gray" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            ) : null}
            {!isConnected && !token ? (
              <Button colorScheme="blue" onClick={() => open()}>
                Open Connect Modal
              </Button>
            ) : null}
          </Stack>
        </Flex>
      </Box>

      {isSigning ? (
        <Alert status="info" mt="4" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Confirm the action!</AlertTitle>
          <AlertDescription>Please confirm signing the message in your wallet.</AlertDescription>
        </Alert>
      ) : null}

      {isConnected && token ? (
        <Box mt="4" p="4" borderWidth="1px" borderRadius="md" boxShadow="sm">
          <AccessControl />
        </Box>
      ) : null}

      {permissions.isFetching ? (
        <Box mt="4" display="flex" justifyContent="center">
          <Spinner size="lg" />
        </Box>
      ) : null}

      {!permissions.data.isGranted || !token ? (
        <Alert status="info" mt="4" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Please <strong>login</strong> and <strong>request</strong> access permissions to use
          </AlertDescription>
        </Alert>
      ) : null}
    </Box>
  );
}

module.exports = { AuthConnect };
