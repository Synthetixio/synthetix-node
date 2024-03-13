const { useQuery } = require('@tanstack/react-query');

const { ipcRenderer } = window?.electron || {};

function useIsIpfsInstalled() {
  return useQuery({
    queryKey: ['ipfs', 'isInstalled'],
    queryFn: () => ipcRenderer.invoke('ipfs-isInstalled'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer),
  });
}

module.exports = { useIsIpfsInstalled };
