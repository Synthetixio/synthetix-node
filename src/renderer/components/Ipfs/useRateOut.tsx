import React from 'react';
import { useStatsBw } from './useStatsBw';

export function useRateOut() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    return statsBw ? statsBw.split('\n')[4].split(':')[1].trim() : '';
  }, [statsBw]);
}
