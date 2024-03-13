const { useQuery } = require('@tanstack/react-query');
const { useIsIpfsRunning } = require('./useIsIpfsRunning');

const { ipcRenderer } = window?.electron || {};

function useRepoStat() {
  const { data: isRunning } = useIsIpfsRunning();
  return useQuery({
    queryKey: ['ipfs', 'repo stat'],
    queryFn: async () => {
      const stats = await ipcRenderer.invoke('ipfs-repo-stat');
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

module.exports = { useRepoStat };
