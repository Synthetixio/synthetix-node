import { useQuery } from '@tanstack/react-query';
import { useIsFollowerRunning } from './useIsFollowerRunning';

const { ipcRenderer } = window?.electron || {};

export function useFollowerInfo() {
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
