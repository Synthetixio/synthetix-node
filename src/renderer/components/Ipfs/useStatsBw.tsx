import { useQuery } from '@tanstack/react-query';
import { useIsRunning } from './useIsRunning';

const { ipcRenderer } = window?.electron || {};

export function useStatsBw() {
  const { data: isRunning } = useIsRunning();
  return useQuery({
    queryKey: ['ipfs', 'stats bw'],
    queryFn: async () => {
      const stats = await ipcRenderer.invoke('ipfs-stats-bw');
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
