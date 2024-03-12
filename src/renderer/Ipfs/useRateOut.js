const React = require('react');
const { useStatsBw } = require('./useStatsBw');

function useRateOut() {
  const { data: statsBw } = useStatsBw();
  return React.useMemo(() => {
    if (!statsBw || !statsBw.RateOut) {
      return '';
    }
    return `${Math.round(statsBw.RateOut)} B/s`;
  }, [statsBw]);
}

module.exports = { useRateOut };
