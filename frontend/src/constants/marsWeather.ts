// Mars weather chart constants
export const CHART_COLORS = {
  tempMax: '#ff4e1d', // Mars red for max
  temp: '#ffeb3b',    // Yellow for average
  tempMin: '#00bcd4', // Blue for min
  pressureMax: '#ff4e1d', // Red for max
  pressure: '#ffeb3b',    // Yellow for avg
  pressureMin: '#00bcd4', // Blue for min
  wind: '#f7b733', // Dusty yellow
  grid: '#a86b3c',
  bgGradient: 'linear-gradient(135deg, #2d1a13 0%, #6e2e1e 100%)',
};

export const MARS_THEME = {
  background: 'transparent',
  text: { fill: '#ffe5c2', fontFamily: 'Orbitron, sans-serif', fontWeight: 600 },
  axis: {
    domain: { line: { stroke: '#b97a56', strokeWidth: 2 } },
    legend: { text: { fill: '#ffe5c2', fontSize: 16, fontWeight: 700 } },
    ticks: {
      line: { stroke: '#b97a56', strokeWidth: 1 },
      text: { fill: '#ffe5c2', fontSize: 13, fontWeight: 600 },
    },
  },
  grid: { line: { stroke: '#a86b3c', strokeDasharray: '2 6', opacity: 0.3 } },
  tooltip: {
    container: {
      background: '#2d1a13',
      color: '#ffe5c2',
      fontSize: 14,
      borderRadius: 8,
      boxShadow: '0 2px 8px #0008',
      border: '1px solid #b97a56',
    },
  },
  legends: { text: { fill: '#ffe5c2', fontWeight: 700 } },
};

export const COMPASS_DIRECTIONS_16 = [
  'N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'
]; 