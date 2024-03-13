const { useQuery } = require('@tanstack/react-query');
const { useIsFollowerInstalled } = require('./useIsFollowerInstalled');

const { ipcRenderer } = window?.electron || {};

function useIsFollowerRunning() {
  const { data: isInstalled } = useIsFollowerInstalled();
  return useQuery({
    queryKey: ['follower', 'isRunning'],
    queryFn: () => ipcRenderer.invoke('follower-isRunning'),
    initialData: () => false,
    placeholderData: false,
    enabled: Boolean(ipcRenderer && isInstalled),
  });
}

module.exports = { useIsFollowerRunning };
