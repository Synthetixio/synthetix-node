import React from 'react';
import { useRepoStat } from './useRepoStat';

export function useHostingSize() {
  const { data: repoStat } = useRepoStat();
  return React.useMemo(() => {
    if (!repoStat) {
      return 0;
    }
    const numBytes = parseInt(repoStat.split('\n')[1].split(':')[1].trim(), 10);
    const numMegabytes = numBytes / 1024 / 1024;
    return numMegabytes;
  }, [repoStat]);
}
