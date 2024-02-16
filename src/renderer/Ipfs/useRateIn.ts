import React from 'react';
import { useStatsBw } from './useStatsBw';

export function useRateIn() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    if (!statsBw || !statsBw.RateIn) {
      return '';
    }
    return statsBw.RateIn;
  }, [statsBw]);
}
