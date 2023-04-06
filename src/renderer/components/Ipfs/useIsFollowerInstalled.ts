import { useQuery } from '@tanstack/react-query';

const { ipcRenderer } = window?.electron || {};

export function useIsFollowerInstalled() {
  return useQuery({
    queryKey: ['follower', 'isInstalled'],
    queryFn: () => ipcRenderer.invoke('follower-isInstalled'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer),
  });
}
