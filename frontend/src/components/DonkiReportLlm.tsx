import React from "react";

// Types for the DONKI report structure

type DonkiEvent = {
  event_type: string;
  date: string;
  start_time?: string;
  speed?: string;
  [key: string]: any;
};

type DonkiPrediction = {
  predicted_impact: string;
  start_time: string;
  predicted_impact_plus_minus_hours: string;
};

type DonkiReport = {
  report_coverage_begin_date: string;
  report_coverage_end_date: string;
  message_issue_date: string;
  message_id: string;
  summary: string;
  events: DonkiEvent[];
  space_weather_outlook: {
    outlook_coverage_begin_date: string;
    outlook_coverage_end_date: string;
    solar_activity: string;
    geomagnetic_activity: string;
  };
  predictions: DonkiPrediction[];
};

interface DonkiReportLlmProps {
  report: DonkiReport | undefined | null;
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 24,
  background: '#181c24',
  borderRadius: 8,
  overflow: 'hidden',
};
const thtdStyle: React.CSSProperties = {
  border: "1px solid #333",
  padding: "6px 10px",
  textAlign: "left",
  background: '#23293a',
  color: '#e0e6f0',
};
const valueStyle: React.CSSProperties = {
  fontWeight: 600,
  padding: '0 2px',
  borderRadius: 4,
  marginLeft: 2,
};

// Helper to format ISO date/time strings
function formatDateTime(dateStr?: string) {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

// CME Typification system
function getCmeType(speedStr?: string) {
  if (!speedStr) return null;
  const match = speedStr.match(/([\d.]+)/);
  if (!match) return null;
  const speed = parseFloat(match[1]);
  if (isNaN(speed)) return null;
  if (speed < 500) return 'S';
  if (speed < 1000) return 'C';
  if (speed < 2000) return 'O';
  if (speed < 3000) return 'R';
  return 'ER';
}

function getEventColor(event: DonkiEvent) {
  if (event.event_type === 'Flare') return { background: '#2d3a4a', color: '#ffb347' };
  if (event.event_type === 'CME') {
    const cmeType = getCmeType(event.speed);
    switch (cmeType) {
      case 'S': return { background: '#2a3d2d', color: '#7fffd4' };
      case 'C': return { background: '#2d3a4a', color: '#4fc3f7' };
      case 'O': return { background: '#3a2d4a', color: '#b388ff' };
      case 'R': return { background: '#4a2d2d', color: '#ff8a65' };
      case 'ER': return { background: '#4a2d39', color: '#ff1744' };
      default: return { background: '#23293a', color: '#e0e6f0' };
    }
  }
  return { background: '#23293a', color: '#e0e6f0' };
}

const cmeLegend = [
  { type: 'S', label: 'S-type: <500 km/s', color: '#7fffd4', bg: '#2a3d2d' },
  { type: 'C', label: 'C-type: 500-999 km/s', color: '#4fc3f7', bg: '#2d3a4a' },
  { type: 'O', label: 'O-type: 1000-1999 km/s', color: '#b388ff', bg: '#3a2d4a' },
  { type: 'R', label: 'R-type: 2000-2999 km/s', color: '#ff8a65', bg: '#4a2d2d' },
  { type: 'ER', label: 'ER-type: >3000 km/s', color: '#ff1744', bg: '#4a2d39' },
];

const DonkiReportLlm: React.FC<DonkiReportLlmProps> = ({ report }) => {
  if (!report || typeof report !== 'object') return <div>No report data available.</div>;

  // Defensive: events and predictions should be arrays
  const events = Array.isArray(report.events) ? report.events : [];
  const predictions = Array.isArray(report.predictions) ? report.predictions : [];
  const outlook = report.space_weather_outlook || {};

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h2>NASA DONKI Report</h2>
      <div>
        <strong>Coverage:</strong> {formatDateTime(report.report_coverage_begin_date)} to {formatDateTime(report.report_coverage_end_date)}
      </div>
      <div>
        <strong>Issued:</strong> {formatDateTime(report.message_issue_date)} (<span>{report.message_id}</span>)
      </div>
      <p style={{ fontSize: "1.2em", margin: "16px 0" }}>
        <strong>Summary:</strong> {typeof report.summary === 'string' ? report.summary : ''}
      </p>

      <h3>Events</h3>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#b0b8c9' }}>
        <strong>CME Typification System:</strong> &nbsp;
        <span style={{ fontWeight: 400 }}>
          S-type: &lt;500 km/s, C-type: 500-999 km/s, O-type: 1000-1999 km/s, R-type: 2000-2999 km/s, ER-type: &gt;3000 km/s
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {cmeLegend.map(l => (
          <span key={l.type} style={{ background: l.bg, color: l.color, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{l.label}</span>
        ))}
      </div>
      {events.length === 0 ? (
        <div>No events found.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtdStyle}>Type</th>
              <th style={thtdStyle}>Date/Time</th>
              <th style={thtdStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => {
              const colorStyle = getEventColor(event);
              // Use start_time, then start_date, then date for event date/time
              const eventDate = event.start_time || event.start_date || event.date;
              return (
                <tr key={idx} style={{ background: colorStyle.background }}>
                  <td style={{ ...thtdStyle, color: colorStyle.color, background: colorStyle.background }}>{event.event_type}</td>
                  <td style={{ ...thtdStyle, color: colorStyle.color, background: colorStyle.background }}>{formatDateTime(eventDate)}</td>
                  <td style={thtdStyle}>
                    {Object.entries(event)
                      .filter(([k]) => k !== "event_type" && k !== "date" && k !== "start_time" && k !== "start_date")
                      .map(([k, v]) => {
                        let valueNode: React.ReactNode = null;
                        if (k.toLowerCase().includes('date') || k.toLowerCase().includes('time')) {
                          valueNode = <span style={{ ...valueStyle, color: '#ffd54f', background: '#23293a' }}>{formatDateTime(v)}</span>;
                        } else if (k === 'speed' && event.event_type === 'CME') {
                          const cmeType = getCmeType(v);
                          let cmeColor = cmeLegend.find(l => l.type === cmeType);
                          valueNode = <span style={{ ...valueStyle, color: cmeColor?.color, background: cmeColor?.bg }}>{v} {cmeType ? `(${cmeType}-type)` : ''}</span>;
                        } else {
                          valueNode = <span style={{ ...valueStyle, color: colorStyle.color, background: '#23293a' }}>{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}</span>;
                        }
                        return (
                          <div key={k} style={{ marginBottom: 2 }}>
                            <strong style={{ color: '#b0b8c9' }}>{k.replace(/_/g, " ")}:</strong> {valueNode}
                          </div>
                        );
                      })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3>Space Weather Outlook</h3>
      <div>
        <strong>Coverage:</strong> {formatDateTime(outlook.outlook_coverage_begin_date)} to {formatDateTime(outlook.outlook_coverage_end_date)}
      </div>
      <div>
        <strong>Solar Activity:</strong> {outlook.solar_activity || '-'}
      </div>
      <div>
        <strong>Geomagnetic Activity:</strong> {outlook.geomagnetic_activity || '-'}
      </div>

      <h3>Predictions</h3>
      {predictions.length === 0 ? (
        <div>No predictions found.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtdStyle}>Impact</th>
              <th style={thtdStyle}>Start Time</th>
              <th style={thtdStyle}>± Hours</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred, idx) => (
              <tr key={idx}>
                <td style={thtdStyle}>{pred.predicted_impact}</td>
                <td style={thtdStyle}>{formatDateTime(pred.start_time)}</td>
                <td style={thtdStyle}>{pred.predicted_impact_plus_minus_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DonkiReportLlm;
