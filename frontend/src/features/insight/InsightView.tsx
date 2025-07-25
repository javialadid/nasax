import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useApiWithBackoff, nasaApiFetch } from '@/hooks/useNasaApi';
import { prepareChartData } from '@/utils/marsWeatherUtils';
import { CHART_COLORS } from '@/constants/marsWeather';
import { InsightWeatherApiResponse } from '@/types/marsWeather';
import ChartContainer from '@/components/ChartContainer';
import MarsLineChart from '@/features/insight/MarsLineChart';
import { useNasaCardData } from '@/context/NasaCardDataContext';

const API_ENDPOINT = 'insight_weather/';
const API_PARAMS = { feedtype: 'json', ver: '1.0' };

const InsightView: React.FC = () => {
  const { insightWeather, setInsightWeather, setInsightWeatherEmpty } = useNasaCardData();
  const shouldFetch = !insightWeather.data && !insightWeather.empty;
  const { data, loading: apiLoading, error } = useApiWithBackoff(
    () => nasaApiFetch(API_ENDPOINT, API_PARAMS),
    [shouldFetch],
    { enabled: shouldFetch }
  );
  const [loading, setLoading] = useState(shouldFetch);

  useEffect(() => {
    if (insightWeather.data) {
      setLoading(false);
      return;
    }
    if (!apiLoading && data && data.sol_keys) {
      setInsightWeather(data);
      setLoading(false);
    } else if (!apiLoading && error) {
      setInsightWeatherEmpty();
      setLoading(false);
    } else if (apiLoading && !insightWeather.data) {
      setLoading(true);
    }
  }, [data, apiLoading, error, insightWeather.data, setInsightWeather, setInsightWeatherEmpty]);

  // Use context data for charts
  const weatherData = insightWeather.data;
  const { temp, tempMin, tempMax, wind, pressure, pressureMin, pressureMax } = useMemo(
    () => prepareChartData(weatherData as InsightWeatherApiResponse),
    [weatherData]
  );

  if (error && !weatherData) {
    return (
      <div className="flex flex-col w-full max-w-5xl mx-auto min-h-0 h-full flex-1 py-2 px-2 gap-8 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="text-center text-red-500 text-lg">{error.message || String(error)}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto min-h-0 h-full flex-1 py-2 px-2 gap-8 overflow-auto" style={{ maxHeight: '100vh' }}>      
      {loading && <div className="text-center text-lg text-gray-400">Loading weather data...</div>}
      {error && <div className="text-center text-red-500 text-lg">{error.message}</div>}
      {!loading && !error && (
        <>
          <Suspense fallback={<div className='h-70 flex items-center justify-center'>Loading chart...</div>}>
            <ChartContainer title="Temperature (°C)">
              {temp.length === 0 ? (
                <div className="text-center text-orange-100/70 py-8">No temperature data available.</div>
              ) : (
                <MarsLineChart
                  data={[
                    { id: 'Max', data: tempMax },
                    { id: 'Avg', data: temp },
                    { id: 'Min', data: tempMin },
                  ]}
                  colors={[CHART_COLORS.tempMax, CHART_COLORS.temp, CHART_COLORS.tempMin]}
                  pointSize={8}
                  legends={[{
                    anchor: 'top-right',
                    direction: 'column',
                    translateX: 0,
                    translateY: 0,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemsSpacing: 4,
                    symbolSize: 16,
                    symbolShape: 'circle',
                    data: [
                      { id: 'Max', label: 'Max', color: CHART_COLORS.tempMax },
                      { id: 'Avg', label: 'Avg', color: CHART_COLORS.temp },
                      { id: 'Min', label: 'Min', color: CHART_COLORS.tempMin },
                    ],
                  }]}
                />
              )}
            </ChartContainer>
          </Suspense>
          <Suspense fallback={<div className='h-72 flex items-center justify-center'>Loading chart...</div>}>
            <ChartContainer title="Wind Speed (m/s)">
              {wind.length === 0 ? (
                <div className="text-center text-orange-100/70 py-8">No wind data available.</div>
              ) : (
                <MarsLineChart
                  data={[{ id: 'Wind Speed', data: wind }]}
                  colors={[CHART_COLORS.wind]}
                  pointSize={10}
                  enableArea={true}
                  areaOpacity={0.15}
                />
              )}
            </ChartContainer>
          </Suspense>
          <Suspense fallback={<div className='h-72 flex items-center justify-center'>Loading chart...</div>}>
            <ChartContainer title="Pressure (Pa) (Min/Max/Avg)">
              {pressure.length === 0 ? (
                <div className="text-center text-orange-100/70 py-8">No pressure data available.</div>
              ) : (
                <MarsLineChart
                  data={[
                    { id: 'Max', data: pressureMax },
                    { id: 'Avg', data: pressure },
                    { id: 'Min', data: pressureMin },
                  ]}
                  colors={[CHART_COLORS.pressureMax, CHART_COLORS.pressure, CHART_COLORS.pressureMin]}
                  pointSize={8}
                  legends={[{
                    anchor: 'top-right',
                    direction: 'column',
                    translateX: 0,
                    translateY: 0,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemsSpacing: 4,
                    symbolSize: 16,
                    symbolShape: 'circle',
                    data: [
                      { id: 'Max', label: 'Max', color: CHART_COLORS.pressureMax },
                      { id: 'Avg', label: 'Avg', color: CHART_COLORS.pressure },
                      { id: 'Min', label: 'Min', color: CHART_COLORS.pressureMin },
                    ],
                  }]}
                />
              )}
            </ChartContainer>
          </Suspense>
        </>
      )}
    </div>
  );
};

export default InsightView;
