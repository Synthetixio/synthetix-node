const { useMutation, useQueryClient } = require('@tanstack/react-query');
const { useAppKitProvider, useAppKitAccount, useAppKitNetwork } = require('@reown/appkit/react');
const Whitelist = require('@synthetixio/synthetix-node-namespace/deployments/11155420/Whitelist');
const { Contract, BrowserProvider } = require('ethers');

function useWithdrawApplicationMutation() {
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isConnected) throw Error('User disconnected');

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const WhitelistContract = new Contract(Whitelist.address, Whitelist.abi, signer);
      const tx = await WhitelistContract.withdrawApplication();
      await tx.wait();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [chainId, walletAddress, 'permissions'],
      });
    },
    refetchInterval: false,
    onError: console.error,
  });
}

module.exports = {
  useWithdrawApplicationMutation,
};
