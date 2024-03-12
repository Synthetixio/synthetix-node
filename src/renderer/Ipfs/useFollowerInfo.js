const { useQuery } = require('@tanstack/react-query');
const { useIsFollowerRunning } = require('./useIsFollowerRunning');

const { ipcRenderer } = window?.electron || {};

function useFollowerInfo() {
  const { data: isRunning } = useIsFollowerRunning();
  return useQuery({
    queryKey: ['follower', 'info'],
    queryFn: async () => {
      const state = await ipcRenderer.invoke('ipfs-follower-info');
      return {
        ipfs: state?.includes('IPFS peer online: true'),
        cluster: state?.includes('Cluster Peer online: true'),
      };
    },
    initialData: () => ({
      ipfs: false,
      cluster: false,
    }),
    placeholderData: {
      ipfs: false,
      cluster: false,
    },
    enabled: Boolean(ipcRenderer && isRunning),
    refetchInterval: 30_000,
  });
}

module.exports = { useFollowerInfo };
