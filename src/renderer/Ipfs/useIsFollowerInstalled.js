const { useQuery } = require('@tanstack/react-query');

const { ipcRenderer } = window?.electron || {};

function useIsFollowerInstalled() {
  return useQuery({
    queryKey: ['follower', 'isInstalled'],
    queryFn: () => ipcRenderer.invoke('follower-isInstalled'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer),
  });
}

module.exports = { useIsFollowerInstalled };
