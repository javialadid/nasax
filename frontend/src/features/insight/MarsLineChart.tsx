import React, { Suspense } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { CHART_COLORS, MARS_THEME } from '@/constants/marsWeather';
import { ChartDatum } from '@/types/marsWeather';

interface MarsLineChartProps {
  data: any[];
  colors?: string[];
  axisBottom?: any;
  margin?: any;
  pointSize?: number;
  areaOpacity?: number;
  enableArea?: boolean;
  title?: string;
  [key: string]: any;
}

const MarsLineChart: React.FC<MarsLineChartProps> = ({
  data,
  colors = [CHART_COLORS.temp, CHART_COLORS.wind, CHART_COLORS.pressure],
  axisBottom = { legend: 'Sol', legendOffset: 36, legendPosition: 'middle', tickRotation: -30 },
  margin = { top: 30, right: 30, bottom: 50, left: 60 },
  pointSize = 8,
  areaOpacity = 0.15,
  enableArea = false,
  ...rest
}) => (
  <ResponsiveLine
    data={data}
    margin={margin}
    xScale={{ type: 'point' }}
    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
    axisBottom={axisBottom}
    axisLeft={{ legendPosition: 'middle', tickValues: 4 }}
    colors={colors}
    pointSize={pointSize}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'serieColor' }}
    enableArea={enableArea}
    areaOpacity={areaOpacity}
    useMesh={true}
    theme={MARS_THEME}
    enableGridX={false}
    enableGridY={true}
    gridYValues={5}
    curve="monotoneX"
    {...rest}
  />
);

export default MarsLineChart; 