const { useQuery } = require('@tanstack/react-query');
const { abi, address } = require('@vderunov/whitelist-contract/deployments/11155420/Whitelist');
const { Contract, JsonRpcProvider } = require('ethers');
const { useAppKitNetwork, useAppKitAccount } = require('@reown/appkit/react');

function usePermissions() {
  const { chainId } = useAppKitNetwork();
  const { address: walletAddress, isConnected } = useAppKitAccount();

  return useQuery({
    queryKey: [chainId, walletAddress, 'permissions'],
    queryFn: async () => {
      if (!isConnected) throw Error('User disconnected');

      const ethersProvider = new JsonRpcProvider(window.env.OPTIMISM_SEPOLIA_RPC_URL);
      const contract = new Contract(address, abi, ethersProvider);

      const [isPending, isGranted, isAdmin] = await Promise.all([
        contract.isPending(walletAddress),
        contract.isGranted(walletAddress),
        contract.isAdmin(walletAddress),
      ]);

      return { isPending, isGranted, isAdmin };
    },
    enabled: isConnected,
    refetchInterval: false,
    placeholderData: {
      isPending: undefined,
      isGranted: undefined,
      isAdmin: undefined,
    },
  });
}

module.exports = {
  usePermissions,
};
