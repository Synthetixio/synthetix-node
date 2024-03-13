const { useQuery } = require('@tanstack/react-query');
const { useIsIpfsInstalled } = require('./useIsIpfsInstalled');

const { ipcRenderer } = window?.electron || {};

function useIsIpfsRunning() {
  const { data: isInstalled } = useIsIpfsInstalled();
  return useQuery({
    queryKey: ['ipfs', 'isRunning'],
    queryFn: () => ipcRenderer.invoke('ipfs-isRunning'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}

module.exports = { useIsIpfsRunning };
