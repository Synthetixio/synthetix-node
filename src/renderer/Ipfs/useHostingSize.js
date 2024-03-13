const React = require('react');
const { useRepoStat } = require('./useRepoStat');

function useHostingSize() {
  const { data: repoStat } = useRepoStat();
  return React.useMemo(() => {
    if (!repoStat) {
      return 0;
    }
    const numMegabytes = repoStat.RepoSize / 1024 / 1024;
    return numMegabytes;
  }, [repoStat]);
}

module.exports = { useHostingSize };
