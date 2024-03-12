const { useQuery } = require('@tanstack/react-query');
const { useIsIpfsRunning } = require('./useIsIpfsRunning');

const { ipcRenderer } = window?.electron || {};

function useStatsBw() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'stats bw'],
    queryFn: async () => {
      const stats = await ipcRenderer.invoke('ipfs-stats-bw');
      if (!stats) {
        return '';
      }
      return stats;
    },
    initialData: () => '',
    placeholderData: '',
    enabled: Boolean(ipcRenderer && isRunning),
  });
}

module.exports = { useStatsBw };
