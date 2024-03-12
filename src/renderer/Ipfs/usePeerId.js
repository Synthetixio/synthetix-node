const { useQuery } = require('@tanstack/react-query');
const { useIsIpfsRunning } = require('./useIsIpfsRunning');

const { ipcRenderer } = window?.electron || {};

function usePeerId() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'id'],
    queryFn: async () => {
      const id = await ipcRenderer.invoke('ipfs-id');
      if (!id) {
        return '';
      }
      return id;
    },
    initialData: () => '',
    placeholderData: '',
    enabled: Boolean(ipcRenderer && isRunning),
  });
}

module.exports = { usePeerId };
