import { useQuery } from '@tanstack/react-query';
import { DappsSchema } from '../../config';

const { ipcRenderer } = window?.electron || {};

export function useDapps() {
  return useQuery({
    queryKey: ['dapps'],
    queryFn: async () => {
      return DappsSchema.parse(await ipcRenderer.invoke('dapps'));
    },
    initialData: () => [],
    placeholderData: [],
    enabled: Boolean(ipcRenderer),
  });
}
