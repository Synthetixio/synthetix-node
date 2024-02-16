import React from 'react';
import { useRepoStat } from './useRepoStat';

export function useHostingSize() {
  const { data: repoStat } = useRepoStat();
  return React.useMemo(() => {
    if (!repoStat) {
      return 0;
    }
    const numMegabytes = repoStat.RepoSize / 1024 / 1024;
    return numMegabytes;
  }, [repoStat]);
}
