const React = require('react');
const { useMutation } = require('@tanstack/react-query');
const { useAppKitAccount, useDisconnect, useAppKit } = require('@reown/appkit/react');
const { Spinner, Text, Box, Flex, Button, Stack, useColorModeValue } = require('@chakra-ui/react');
const { usePermissions } = require('./usePermissions');
const { getApiUrl, saveToken } = require('./utils');

// TODO make as env
const API_URL = 'http://45.146.7.38:3005/';
const RPC_URL = 'https://sepolia.optimism.io';

const makeUnauthenticatedRequest = async (endpoint, data) => {
  const response = await fetch(`${getApiUrl() || API_URL}${endpoint}`, {
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
  const { address: walletAddress, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const permissions = usePermissions();

  const signupMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('signup', data),
    onSuccess: async ({ nonce }) => {
      // TODO: how to sign a message? maybe use useSignMessage() from wagmi?
      const signer = {};
      signer.signMessage(nonce).then((signedMessage) => {
        verificationMutation.mutate({ nonce, signedMessage });
      });
    },
  });

  const verificationMutation = useMutation({
    mutationFn: (data) => makeUnauthenticatedRequest('verify', data),
    onSuccess: ({ token }) => {
      saveToken({ walletAddress, token });
      setToken(token);
    },
  });

  return (
    <div>
      <Box>
        <Flex
          minH={'60px'}
          py={{ base: 2 }}
          px={{ base: 4 }}
          borderBottom={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.900')}
          align={'center'}
          justify={'flex-end'}
        >
          <Stack flex={{ base: 1, md: 0 }} direction={'row'} spacing={6}>
            <Button onClick={() => open({ view: 'Networks' })}>Open Network Modal</Button>
            {isConnected && token ? (
              <Button onClick={() => console.log('Log Out')}>Log Out</Button>
            ) : null}
            {isConnected && !token ? (
              <>
                <Button onClick={() => signupMutation.mutate({ walletAddress })}> Log In</Button>
                <Button onClick={disconnect}>Disconnect</Button>
              </>
            ) : null}
            {!isConnected && !token ? (
              <Button onClick={() => open()}>Open Connect Modal</Button>
            ) : null}
          </Stack>
        </Flex>
      </Box>

      {permissions.isFetching ? (
        <Spinner />
      ) : permissions.data.isGranted && token ? (
        <input />
      ) : (
        <Text>Please login and request access permissions to use</Text>
      )}
    </div>
  );
}

module.exports = { AuthConnect };
