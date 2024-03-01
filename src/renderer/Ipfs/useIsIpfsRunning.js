import { useQuery } from '@tanstack/react-query';
import { useIsIpfsInstalled } from './useIsIpfsInstalled';

const { ipcRenderer } = window?.electron || {};

export function useIsIpfsRunning() {
  const { data: isInstalled } = useIsIpfsInstalled();
  return useQuery({
    queryKey: ['ipfs', 'isRunning'],
    queryFn: () => ipcRenderer.invoke('ipfs-isRunning'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}
