import { useQuery } from '@tanstack/react-query';
import { useIsIpfsRunning } from './useIsIpfsRunning';

const { ipcRenderer } = window?.electron || {};

export function usePeerId() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'id'],
    queryFn: async () => {
      const id = await ipcRenderer.invoke('ipfs-id');
      if (!id) {
        return '';
      }
      return id;
    },
    initialData: () => '',
    placeholderData: '',
    enabled: Boolean(ipcRenderer && isRunning),
  });
}
