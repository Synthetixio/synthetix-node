const React = require('react');
const { useStatsBw } = require('./useStatsBw');

function useRateIn() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    if (!statsBw || !statsBw.RateIn) {
      return '';
    }
    return `${Math.round(statsBw.RateIn)} B/s`;
  }, [statsBw]);
}

module.exports = { useRateIn };
