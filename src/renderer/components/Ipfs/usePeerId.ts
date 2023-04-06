import { useQuery } from '@tanstack/react-query';
import { useIsIpfsInstalled } from './useIsIpfsInstalled';

const { ipcRenderer } = window?.electron || {};

export function usePeerId() {
  const { data: isInstalled } = useIsIpfsInstalled();
  return useQuery({
    queryKey: ['ipfs', 'id'],
    queryFn: async () => {
      const { ID: id } = JSON.parse(await ipcRenderer.invoke('ipfs-id'));
      if (!id) {
        return '';
      }
      return id;
    },
    initialData: () => '',
    placeholderData: '',
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}
