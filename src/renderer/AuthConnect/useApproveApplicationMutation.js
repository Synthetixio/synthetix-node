const { useMutation, useQueryClient } = require('@tanstack/react-query');
const { useAppKitProvider, useAppKitAccount, useAppKitNetwork } = require('@reown/appkit/react');
const { abi, address } = require('@vderunov/whitelist-contract/deployments/11155420/Whitelist');
const { Contract, BrowserProvider } = require('ethers');

function useApproveApplicationMutation() {
  const { isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet) => {
      if (!isConnected) throw Error('User disconnected');

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(address, abi, signer);
      const tx = await contract.approveApplication(wallet);
      await tx.wait();

      queryClient.invalidateQueries({
        queryKey: [chainId, wallet, 'permissions'],
      });
    },
    refetchInterval: false,
    onError: console.error,
  });
}

module.exports = {
  useApproveApplicationMutation,
};
