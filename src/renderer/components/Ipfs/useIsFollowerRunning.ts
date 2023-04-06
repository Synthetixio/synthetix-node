import { useQuery } from '@tanstack/react-query';
import { useIsFollowerInstalled } from './useIsFollowerInstalled';

const { ipcRenderer } = window?.electron || {};

export function useIsFollowerRunning() {
  const { data: isInstalled } = useIsFollowerInstalled();
  return useQuery({
    queryKey: ['follower', 'isRunning'],
    queryFn: () => ipcRenderer.invoke('follower-isRunning'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}
