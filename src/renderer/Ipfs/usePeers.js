const { useQuery } = require('@tanstack/react-query');
const { useIsIpfsRunning } = require('./useIsIpfsRunning');

const { ipcRenderer } = window?.electron || {};

function usePeers() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'peers'],
    queryFn: async () => {
      const peers = await ipcRenderer.invoke('peers');
      if (!peers) {
        return [];
      }
      return peers;
    },
    initialData: () => [],
    placeholderData: [],
    enabled: Boolean(ipcRenderer && isRunning),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

module.exports = { usePeers };
