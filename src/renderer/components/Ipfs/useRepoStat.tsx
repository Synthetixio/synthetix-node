import { useQuery } from '@tanstack/react-query';
import { useIsRunning } from './useIsRunning';

const { ipcRenderer } = window?.electron || {};

export function useRepoStat() {
  const { data: isRunning } = useIsRunning();
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
