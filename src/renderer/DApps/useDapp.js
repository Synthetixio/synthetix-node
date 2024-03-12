const { useQuery } = require('@tanstack/react-query');

const { ipcRenderer } = window?.electron || {};

function useDapp(id) {
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

module.exports = {
  useDapp,
};
