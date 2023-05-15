import { useQuery } from '@tanstack/react-query';
import { DappType } from '../../types';

const { ipcRenderer } = window?.electron || {};

export function useDapps() {
  return useQuery({
    queryKey: ['dapps'],
    queryFn: async () => {
      const dapps = await ipcRenderer.invoke('dapps');
      return dapps as DappType[];
    },
    initialData: () => [],
    placeholderData: [],
    enabled: Boolean(ipcRenderer),
  });
}
