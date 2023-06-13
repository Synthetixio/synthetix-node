import { useQuery } from '@tanstack/react-query';
import { useIsIpfsRunning } from './useIsIpfsRunning';

const { ipcRenderer } = window?.electron || {};

export function usePeers() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'peers'],
    queryFn: async () => {
      const peers = await ipcRenderer.invoke('peers');
      if (!peers) {
        return [];
      }
      return peers;
    },
    initialData: () => [],
    placeholderData: [],
    enabled: Boolean(ipcRenderer && isRunning),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
