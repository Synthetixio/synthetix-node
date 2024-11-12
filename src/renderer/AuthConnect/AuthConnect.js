const React = require('react');
const { useMutation } = require('@tanstack/react-query');
const {
  useAppKitAccount,
  useDisconnect,
  useAppKit,
  useAppKitProvider,
  useAppKitNetwork,
} = require('@reown/appkit/react');
const {
  Spinner,
  Box,
  Flex,
  Button,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} = require('@chakra-ui/react');
const { optimismSepolia } = require('@reown/appkit/networks');
const { usePermissions } = require('./usePermissions');
const { AccessControl } = require('./AccessControl');
const { NetworkMismatch } = require('./NetworkMismatch');
const { getApiUrl, saveToken, removeToken, restoreToken } = require('./utils');
const { BrowserProvider } = require('ethers');
const { useNavigate } = require('react-router-dom');

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
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { chainId } = useAppKitNetwork();
  const [isNetworkMismatch, setIsNetworkMismatch] = React.useState(optimismSepolia.id !== chainId);
  const { walletProvider } = useAppKitProvider('eip155');
  const permissions = usePermissions();
  const navigate = useNavigate();

  React.useEffect(() => {
    const restoredToken = restoreToken({ walletAddress });
    if (restoredToken) {
      setToken(restoredToken);
    }
  }, [walletAddress]);

  React.useEffect(() => {
    setIsNetworkMismatch(optimismSepolia.id !== chainId);
  }, [chainId]);

  const signupMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('signup', data),
    onSuccess: async ({ nonce }) => {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const signedMessage = await signer?.signMessage(nonce);
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

  if (isConnected && isNetworkMismatch) {
    return <NetworkMismatch />;
  }

  return (
    <>
      <Box as="header" width="100%" borderBottomWidth="1px" p={3}>
        <Flex maxW="1200px" mx="auto" align="center" justify="space-between">
          <Box>Synthetix Node</Box>
          <Stack direction="row" spacing={4} align="center">
            <Button colorScheme="teal" variant="outline" onClick={() => navigate('/')}>
              Go to Main Page
            </Button>
            {isConnected && token ? (
              <Button colorScheme="teal" variant="outline" onClick={logout}>
                Log Out
              </Button>
            ) : null}
            {isConnected && !token ? (
              <>
                <Button
                  colorScheme="teal"
                  variant="outline"
                  isLoading={signupMutation.isPending}
                  onClick={() => signupMutation.mutate({ walletAddress })}
                >
                  Log In
                </Button>
                <Button colorScheme="teal" variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            ) : null}
            {!isConnected && !token ? (
              <Button colorScheme="teal" variant="outline" onClick={() => open()}>
                Connect Wallet
              </Button>
            ) : null}
          </Stack>
        </Flex>
      </Box>

      {isConnected ? (
        <Box minW="600px" mx="auto" mt="4">
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p="6">
            {permissions.isFetching ? (
              <Box mt="4" display="flex" justifyContent="center">
                <Spinner size="lg" />
              </Box>
            ) : null}

            {signupMutation.isPending ? (
              <Alert status="info" mt="4" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Confirm the action!</AlertTitle>
                <AlertDescription>
                  Please confirm signing the message in your wallet.
                </AlertDescription>
              </Alert>
            ) : null}

            {permissions.data.isGranted ? (
              <Alert status="success" mt="4" borderRadius="md">
                <AlertIcon />
                <AlertDescription>Access granted</AlertDescription>
              </Alert>
            ) : null}

            {!permissions.data.isGranted && token ? (
              <Box mt="4" p="4" borderWidth="1px" borderRadius="md">
                <AccessControl />
              </Box>
            ) : null}

            {!permissions.data.isGranted && !token ? (
              <Alert status="info" mt="4" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Please <strong>login</strong> and <strong>request</strong> access permissions to
                  use
                </AlertDescription>
              </Alert>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </>
  );
}

module.exports = { AuthConnect };
