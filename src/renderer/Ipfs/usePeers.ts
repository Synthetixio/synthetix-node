import { useQuery } from '@tanstack/react-query';
import { useIsIpfsRunning } from './useIsIpfsRunning';

const { ipcRenderer } = window?.electron || {};

export function usePeers() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'peers'],
    queryFn: async () => {
      const peers = await ipcRenderer.invoke('ipfs-peers');
      if (!peers) {
        return 0;
      }
      return peers.trim().split('\n').length;
    },
    initialData: () => 0,
    placeholderData: 0,
    enabled: Boolean(ipcRenderer && isRunning),
  });
}
