import React from 'react';
import { useStatsBw } from './useStatsBw';

export function useRateOut() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    if (!statsBw || !statsBw.RateOut) {
      return '';
    }
    return statsBw.RateOut;
  }, [statsBw]);
}
