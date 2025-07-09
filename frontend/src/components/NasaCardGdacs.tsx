import React, { useState } from 'react';
import NasaCard from './NasaCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

// Types and helpers

type GdacsEvent = {
  id: number;
  type: string;
  severity: number;
  week: number;
};

type BarData = { type: string; count: number };
type LineData = { week: number; severity: number };
type PieData = { name: string; value: number };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384'];

function getBarData(events: GdacsEvent[]): BarData[] {
  const byType: Record<string, number> = {};
  events.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });
  return Object.entries(byType).map(([type, count]) => ({ type, count }));
}

function getLineData(events: GdacsEvent[]): LineData[] {
  // Group by week, sum severity
  const byWeek: Record<number, number> = {};
  events.forEach((e) => {
    byWeek[e.week] = (byWeek[e.week] || 0) + e.severity;
  });
  return Object.entries(byWeek).map(([week, severity]) => ({ week: Number(week), severity }));
}

function getWeekNumber(dateString: string): number {
  const date = new Date(dateString);
  const firstJan = new Date(date.getFullYear(), 0, 1);
  // @ts-ignore
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

const END_DATE = '2025-07-08';
const END_DATE_OBJ = new Date(END_DATE);
const RANGE_OPTIONS = [
  { label: 'Year to Date', value: 'ytd', days: () => Math.ceil((END_DATE_OBJ.getTime() - new Date(`${END_DATE_OBJ.getFullYear()}-01-01`).getTime()) / (1000 * 60 * 60 * 24)) },
  { label: '1 Year', value: '1y', days: () => 365 },
  { label: '3 Years', value: '3y', days: () => 365 * 3 },
  { label: '10 Years', value: '10y', days: () => 365 * 10 },
];

function getDays(option: string): number {
  const opt = RANGE_OPTIONS.find(o => o.value === option);
  return opt ? opt.days() : 365;
}

function getStartDateFromDays(days: number): string {
  const end = END_DATE_OBJ;
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}

const NasaCardGdacs: React.FC = () => {
  const [range, setRange] = useState('ytd');
  const days = getDays(range);
  const start = getStartDateFromDays(days);
  const params = {
    //source: 'EM-DAT',    
    days: String(days),
	limit: '100000',
    status: 'open,closed',
    domain: 'eonet.gsfc.nasa.gov',
  };
  return (
    <NasaCard
      endpoint="api/v2.1/events"
      params={params}
      render={(data, expanded) => {
		
        // DEBUG: Log all distinct months and years in the data
        if (data && data.events) {
          const allDates = data.events.map((ev: any) => ev.geometries && ev.geometries[0] && ev.geometries[0].date).filter(Boolean) as string[];
          const allMonths = Array.from(new Set(allDates.map((d: string) => d.slice(0, 7)))).sort();
          const allYears = Array.from(new Set(allDates.map((d: string) => d.slice(0, 4)))).sort();
          console.log('DEBUG: Distinct months:', allMonths);
          console.log('DEBUG: Distinct years:', allYears);
        }
        // DEBUG: Check if the last event's month is present in the chart data
        if (data && data.events && data.events.length > 0) {
          const lastEvent = data.events[data.events.length - 1];
          const lastDate = lastEvent.geometries && lastEvent.geometries[0] && lastEvent.geometries[0].date;
          const lastMonth = lastDate ? lastDate.slice(0, 7) : null;
          const monthsInChart = getEventsPerMonth(data.events).map(m => m.month);
          console.log('DEBUG: Last event date:', lastDate, 'Last event month:', lastMonth);
          console.log('DEBUG: Is last event month in chart?', lastMonth && monthsInChart.includes(lastMonth));
        }
        const events = data && data.events ? transformEvents(data.events) : [];
        // Card preview (collapsed)
        if (!expanded) {
          const mainType = getBarData(events).sort((a, b) => b.count - a.count)[0]?.type || 'Disaster';
          return (
            <>
              <div className="absolute top-0 left-0 w-full bg-gray-900/70 text-white text-lg font-semibold px-3 py-2 text-center z-10 truncate">
                GDACS: Disasters 
              </div>
              <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
                <span className="text-4xl font-bold text-blue-200 drop-shadow mb-2">{mainType}</span>
                <span className="text-xs text-gray-300 mt-2">Click for details & charts</span>
              </div>
            </>
          );
        }
        // Expanded: show charts
        return (
          <>
            {/* Date Range Selector */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-2 gap-2">
              <div className="text-sm text-blue-200">
                Date range: <span className="font-semibold">{start}</span> to <span className="font-semibold">{END_DATE}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`px-3 py-1 rounded border text-sm font-semibold transition-colors duration-100 ${range === opt.value ? 'bg-blue-700 text-white border-blue-400' : 'bg-gray-800 text-blue-200 border-gray-600 hover:bg-blue-900'}`}
                    onClick={() => setRange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Charts Area */}
            <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
              {/* Pie Chart: Events by Type */}
              <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col items-center w-full max-w-6xl mx-auto">
                <h3 className="text-lg font-semibold mb-2">Events by Type</h3>
                <div className="flex justify-center w-full">
                  <PieChart width={600} height={320}>
                    <Pie
                      data={getBarData(events)}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {getBarData(events).map((entry, idx) => (
                        <Cell key={`cell-type-pie-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </div>
              </div>
              {/* Line Chart: Weekly Severity Trend */}
              <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col items-center w-full max-w-6xl mx-auto">
                <h3 className="text-lg font-semibold mb-2">Weekly Severity Trend</h3>
                <div className="flex justify-center w-full">
                  <LineChart width={1000} height={320} data={getLineData(events)}>
                    <XAxis dataKey="week" stroke="#fff"/>
                    <YAxis stroke="#fff"/>
                    <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                    <Line type="monotone" dataKey="severity" stroke="#FFBB28" strokeWidth={3} dot={{ r: 4 }}/>
                  </LineChart>
                </div>
              </div>
              {/* Line Chart: Total Events Per Month */}
              <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col items-center w-full max-w-6xl mx-auto">
                <h3 className="text-lg font-semibold mb-2">Total Events Per Month</h3>
                <div className="flex justify-center w-full">
                  <LineChart width={1000} height={320} data={getEventsPerMonth(data && data.events ? data.events : [])}>
                    <XAxis dataKey="month" stroke="#fff"/>
                    <YAxis stroke="#fff" allowDecimals={false}/>
                    <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                    <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={3} dot={{ r: 4 }}/>
                  </LineChart>
                </div>
              </div>
              {/* Top 10 Countries by Event Count (Horizontal Bar Chart) */}
              <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col items-center w-full max-w-6xl mx-auto">
                <h3 className="text-lg font-semibold mb-2">Top 10 Countries by Event Count</h3>
                <div className="flex justify-center w-full">
                  <BarChart
                    width={1000}
                    height={400}
                    data={getTopCountriesData(data && data.events ? data.events : [])}
                    layout="vertical"
                    margin={{ left: 60, right: 40, top: 20, bottom: 20 }}
                  >
                    <XAxis type="number" stroke="#fff" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#fff" width={180} />
                    <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Bar dataKey="value" fill="#00C49F" activeBar={{ fill: '#00C49F', stroke: 'none', filter: 'none', opacity: 1 }}>
                      {getTopCountriesData(data && data.events ? data.events : []).map((entry, idx) => (
                        <Cell key={`cell-country-bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            </div>
            {/* Description Area 
            <div className="w-full bg-gray-800/80 px-6 py-4 text-center text-base text-gray-200">
              <span>
                GDACS provides real-time alerts for disasters worldwide.
              </span>
            </div>*/}
          </>
        );
      }}
    />
  );
};

function transformEvents(apiEvents: any[]): GdacsEvent[] {
  return apiEvents.map((ev: any, idx: number) => {
    const type = ev.categories && ev.categories[0] ? ev.categories[0].title : 'Disaster';
    const severity = 0.5; // Not provided
    const week = ev.geometries && ev.geometries[0] ? getWeekNumber(ev.geometries[0].date) : 1;
    return {
      id: idx + 1,
      type,
      severity,
      week,
    };
  });
}

// Extract country from event title (basic)
function extractCountry(title: string): string {
  const match = title.match(/in ([A-Za-z ]+) ?(\d+)?$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

// Get top 10 countries by event count for chart
function getTopCountriesData(events: any[]): { name: string; value: number }[] {
  const byCountry: Record<string, number> = {};
  events.forEach((e) => {
    const country = extractCountry(e.title || '');
    if (country && country !== 'Unknown') {
      byCountry[country] = (byCountry[country] || 0) + 1;
    }
  });
  return Object.entries(byCountry)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// Group events by month for total events per month chart
function getEventsPerMonth(events: any[]): { month: string; count: number }[] {
  const byMonth: Record<string, number> = {};
  events.forEach(ev => {
    const date = ev.geometries && ev.geometries[0] && ev.geometries[0].date;
    if (date) {
      const month = date.slice(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });
  return Object.entries(byMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export default NasaCardGdacs; 