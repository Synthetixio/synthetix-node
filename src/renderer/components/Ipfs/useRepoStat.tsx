import { useQuery } from '@tanstack/react-query';
import { useIsIpfsRunning } from './useIsIpfsRunning';

const { ipcRenderer } = window?.electron || {};

export function useRepoStat() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'repo stat'],
    queryFn: async () => {
      const stats = await ipcRenderer.invoke('ipfs-repo-stat');
      if (!stats) {
        return '';
      }
      return stats;
    },
    initialData: () => '',
    placeholderData: '',
    enabled: Boolean(ipcRenderer && isRunning),
  });
}
