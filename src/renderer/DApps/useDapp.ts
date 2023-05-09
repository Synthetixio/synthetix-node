import { useQuery } from '@tanstack/react-query';

const { ipcRenderer } = window?.electron || {};

export function useDapp(id: string) {
  return useQuery({
    queryKey: ['dapp', id],
    queryFn: async () => {
      const url = await ipcRenderer.invoke('dapp', id);
      if (!url) {
        return null;
      }
      return url;
    },
    initialData: () => null,
    placeholderData: null,
    enabled: Boolean(ipcRenderer),
  });
}
