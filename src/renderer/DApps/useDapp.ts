import { useQuery } from '@tanstack/react-query';

const { ipcRenderer } = window?.electron || {};

export function useDapp(ens: string) {
  return useQuery({
    queryKey: ['dapp', ens],
    queryFn: async () => {
      const url = await ipcRenderer.invoke('dapp', ens);
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
