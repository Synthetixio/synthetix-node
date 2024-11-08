const React = require('react');
const { useAppKitNetwork, useAppKitAccount } = require('@reown/appkit/react');
const { useQueryClient, useQuery } = require('@tanstack/react-query');
const { usePermissions } = require('./usePermissions');
const { useApproveApplicationMutation } = require('./useApproveApplicationMutation');
const { useRejectApplicationMutation } = require('./useRejectApplicationMutation');
const { useSubmitApplicationMutation } = require('./useSubmitApplicationMutation');
const { useWithdrawApplicationMutation } = require('./useWithdrawApplicationMutation');
const ethers = require('ethers');
const { getApiUrl, restoreToken } = require('./utils');
const { Skeleton, Button, Box, Input, Stack, Heading, VStack, Text } = require('@chakra-ui/react');
const { WalletsList } = require('./WalletsList');

function AccessControl() {
  const { chainId } = useAppKitNetwork();
  const { address: walletAddress } = useAppKitAccount();
  const queryClient = useQueryClient();
  const [userApproveWallet, setUserApproveWallet] = React.useState('');
  const [userApproveWalletError, setUserApproveWalletError] = React.useState(false);
  const [userRejectWallet, setUserRejectWallet] = React.useState('');
  const [userRevokeWalletError, setUserRevokeWalletError] = React.useState(false);

  const permissions = usePermissions();
  const approveApplicationMutation = useApproveApplicationMutation();
  const rejectApplicationMutation = useRejectApplicationMutation();
  const submitApplicationMutation = useSubmitApplicationMutation();
  const withdrawApplicationMutation = useWithdrawApplicationMutation();

  const isLoading =
    permissions.isFetching ||
    approveApplicationMutation.isPending ||
    rejectApplicationMutation.isPending ||
    submitApplicationMutation.isPending ||
    withdrawApplicationMutation.isPending;

  const handleApproveApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userApproveWallet)) {
      approveApplicationMutation.mutate(userApproveWallet, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [chainId, 'approved-wallets'] });
          queryClient.invalidateQueries({ queryKey: [chainId, 'submitted-wallets'] });
        },
      });
    } else {
      setUserApproveWalletError(true);
    }
  };

  const handleRejectApplicationSubmit = async (e) => {
    e.preventDefault();

    if (ethers.isAddress(userRejectWallet)) {
      rejectApplicationMutation.mutate(userRejectWallet);
    } else {
      setUserRevokeWalletError(true);
    }
  };

  const approvedWallets = useQuery({
    queryKey: [chainId, 'approved-wallets'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}approved-wallets`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${restoreToken({ walletAddress })}` },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: permissions.data.isAdmin === true,
    refetchInterval: false,
    select: (data) => data.data.wallets,
  });

  const submittedWallets = useQuery({
    queryKey: [chainId, 'submitted-wallets'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}submitted-wallets`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${restoreToken({ walletAddress })}` },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: permissions.data.isAdmin === true,
    refetchInterval: false,
    select: (data) => data.data.wallets,
  });

  let content;
  switch (true) {
    case isLoading:
      content = (
        <Skeleton
          height="20px"
          width="100%"
          bg="gray.600"
          startColor="gray.500"
          endColor="gray.700"
        />
      );
      break;
    case permissions.data.isGranted:
      content = (
        <Heading size="md" color="green.500">
          Access granted
        </Heading>
      );
      break;
    case permissions.data.isPending:
      content = (
        <VStack spacing={4} align="start">
          <Heading size="md" color="orange.500">
            Please wait for approval
          </Heading>
          <Button colorScheme="orange" onClick={() => withdrawApplicationMutation.mutate()}>
            Renounce assigned role
          </Button>
        </VStack>
      );
      break;
    default:
      content = (
        <VStack spacing={4} align="start">
          <Heading size="md">Access Control</Heading>
          <Button colorScheme="blue" onClick={() => submitApplicationMutation.mutate()}>
            Apply for whitelist
          </Button>
        </VStack>
      );
  }

  return (
    <Stack spacing={6} padding={5} boxShadow="md" borderRadius="md">
      <Box>{content}</Box>
      {permissions.data.isAdmin && !isLoading ? (
        <VStack spacing={8} align="stretch">
          <Box
            as="form"
            onSubmit={handleApproveApplicationSubmit}
            bg="gray.700"
            color="gray.200"
            p={4}
            borderRadius="md"
            boxShadow="sm"
          >
            <Heading size="sm" mb={2}>
              Approve Wallet
            </Heading>
            <Input
              type="text"
              bg="gray.600"
              color="whiteAlpha.900"
              _placeholder={{ color: 'gray.400' }}
              placeholder="Enter wallet address"
              value={userApproveWallet}
              onChange={(e) => {
                setUserApproveWalletError(false);
                setUserApproveWallet(e.target.value);
              }}
              isInvalid={userApproveWalletError}
            />
            <Button
              type="submit"
              colorScheme="green"
              mt={4}
              isDisabled={!userApproveWallet || userApproveWalletError}
              _hover={{ bg: 'green.600' }}
            >
              Submit
            </Button>
          </Box>
          <WalletsList
            title="Submitted Wallets"
            data={submittedWallets.data}
            isFetching={submittedWallets.isFetching}
            isError={submittedWallets.isError}
            error={submittedWallets.error}
          />
          <Box
            as="form"
            onSubmit={handleRejectApplicationSubmit}
            bg="gray.700"
            color="gray.200"
            p={4}
            borderRadius="md"
            boxShadow="sm"
          >
            <Heading size="sm" mb={2}>
              Reject Wallet
            </Heading>
            <Input
              type="text"
              placeholder="Enter wallet address"
              bg="gray.600"
              color="whiteAlpha.900"
              _placeholder={{ color: 'gray.400' }}
              value={userRejectWallet}
              onChange={(e) => {
                setUserRevokeWalletError(false);
                setUserRejectWallet(e.target.value);
              }}
              isInvalid={userRevokeWalletError}
            />
            <Button
              type="submit"
              colorScheme="red"
              mt={4}
              isDisabled={!userRejectWallet || userRevokeWalletError}
              _hover={{ bg: 'red.600' }}
            >
              Submit
            </Button>
          </Box>
          <WalletsList
            title="Approved Wallets"
            data={approvedWallets.data}
            isFetching={approvedWallets.isFetching}
            isError={approvedWallets.isError}
          />
        </VStack>
      ) : null}
    </Stack>
  );
}

module.exports = { AccessControl };
