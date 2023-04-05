import { useQuery } from '@tanstack/react-query';
import { useIsInstalled } from './useIsInstalled';

const { ipcRenderer } = window?.electron || {};

export function useIsRunning() {
  const { data: isInstalled } = useIsInstalled();
  return useQuery({
    queryKey: ['ipfs', 'isRunning'],
    queryFn: () => ipcRenderer.invoke('ipfs-isRunning'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}
