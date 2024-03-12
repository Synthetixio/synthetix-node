const { useQuery } = require('@tanstack/react-query');
const { DappsSchema } = require('../../config');

const { ipcRenderer } = window?.electron || {};

function useDapps() {
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

module.exports = { useDapps };
