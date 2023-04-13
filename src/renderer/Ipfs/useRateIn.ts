import React from 'react';
import { useStatsBw } from './useStatsBw';

export function useRateIn() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    return statsBw ? statsBw.split('\n')[3].split(':')[1].trim() : '';
  }, [statsBw]);
}
