import React, { useState } from 'react';
import flareIcon from '@/assets/icons/flare.svg';
import cmeIcon from '@/assets/icons/cme.svg';
import outlookIcon from '@/assets/icons/outlook.svg';
import impactIcon from '@/assets/icons/impact.svg';
import noteIcon from '@/assets/icons/note.svg';
import aiIcon from '@/assets/icons/ai.svg';
import summaryIcon from '@/assets/icons/summary.svg';
import { formatDateTime, formatShortDateTime } from '@/utils/dateutil';

// Types for the LLM-extracted Donki report
export interface DonkiAiReportData {
  header?: {
    source?: string;
    message_type?: string;
    issue_date?: string;
    coverage_begin_date?: string;
    coverage_end_date?: string;
    message_id?: string;
    disclaimer?: string;
  };
  summary?: {
    solar_activity?: string;
    cme_impacts?: Array<{
      start_time?: string;
      predicted_impacts?: Array<{
        location?: string;
        arrival_time?: string;
        impact_type?: string;
        notification?: string;
      }>;
    }>;
    geomagnetic_activity?: string;
    energetic_electron_flux?: string;
    energetic_proton_flux?: string;
    space_weather_impact?: string;
  };
  events?: {
    flares?: Array<{
      event_type?: string;
      date?: string;
      start_time?: string;
      stop_time?: string;
      peak_time?: string;
      class?: string;
      location?: string;
    }>;
    cmes?: {
      earth_directed?: Array<any>;
      non_earth_directed?: Array<any>;
    };
  };
  outlook?: {
    coverage_begin_date?: string;
    coverage_end_date?: string;
    solar_activity?: string;
    geomagnetic_activity?: string;
  };
  notes?: string;
  ai_summary?: string;
}

interface DonkiAiReportProps {
  data: DonkiAiReportData | null | undefined;
}

const Section: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, defaultOpen = false, children, icon }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 border border-gray-700 rounded-lg bg-gray-900/80">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-lg font-semibold text-left text-blue-200 hover:bg-gray-800 focus:outline-none focus:ring"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">{icon}{title}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" className={`transition-transform ${open ? 'rotate-90' : ''}`}><polyline points="6 8 10 12 14 8" fill="none" stroke="#7dd3fc" strokeWidth="2"/></svg>
      </button>
      {open && <div className="px-1 sm:px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
};

const DonkiAiReport: React.FC<DonkiAiReportProps> = ({ data }) => {
  if (!data) return <div className="text-gray-400">No report data available.</div>;
  const { header, summary, events, outlook, notes, ai_summary } = data;
  return (
    <div className="max-w-3xl mx-auto px-1 sm:px-2 md:p-4 py-2 md:py-4 bg-gray-950/90 rounded-xl shadow-lg border border-gray-800 text-gray-100">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <img src={summaryIcon} width={32} height={32} alt="Summary" /> NASA DONKI AI Report </h2>
        <h3>{header?.issue_date ? formatDateTime(header.issue_date) : '-'}</h3>
      <div className="mb-4 text-sm text-gray-400">        
        <span>{header?.source || 'NASA Donki Report'}</span> &bull; 
        <span>{header?.message_type || 'Space Weather Summary'}</span> &bull;         
        {header?.message_id && <span> &bull; <span className="font-mono">{header.message_id}</span></span>}
        <div><b>Processed with AI</b> for your convenience.</div>
      </div>
      <Section title={`AI Summary`} defaultOpen icon={<img src={aiIcon} width={32} height={32} alt="AI Summary" />}>
        <div className="text-lg text-beige-200 font-semibold mb-2">{ai_summary || <span className="text-gray-400">No summary available.</span>}</div>
      </Section>
      <Section title="Outlook" icon={<img src={outlookIcon} width={32} height={32} alt="Outlook" />}>
        <div className="text-sm mb-2">
          <strong>Coverage:</strong> {outlook?.coverage_begin_date ? formatDateTime(outlook.coverage_begin_date) : '-'} to {outlook?.coverage_end_date ? formatDateTime(outlook.coverage_end_date) : '-'}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Solar Activity:</strong> {outlook?.solar_activity || '-'}</div>
          <div><strong>Geomagnetic Activity:</strong> {outlook?.geomagnetic_activity || '-'}</div>
        </div>
      </Section>  
      <Section title={`Summary`} icon={<img src={summaryIcon} width={32} height={32} alt="Summary" />}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Solar Activity:</strong> {summary?.solar_activity || '-'}</div>
          <div><strong>Geomagnetic Activity:</strong> {summary?.geomagnetic_activity || '-'}</div>
          <div><strong>Energetic Electron Flux:</strong> {summary?.energetic_electron_flux || '-'}</div>
          <div><strong>Energetic Proton Flux:</strong> {summary?.energetic_proton_flux || '-'}</div>
          <div className="col-span-2"><strong>Space Weather Impact:</strong> {summary?.space_weather_impact || '-'}</div>
        </div>
        {summary?.cme_impacts && summary.cme_impacts.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold mb-1 flex items-center gap-2"><img src={impactIcon} width={32} height={32} alt="CME Impact" /> CME Impacts</div>
            <div className="text-xs text-gray-400 mb-1">All times are in UTC.</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-700 rounded-lg">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-2 py-1">Start Time</th>
                    <th className="px-2 py-1">Location</th>
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Arrival Time</th>
                    <th className="px-2 py-1 hidden sm:table-cell">Notification</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.cme_impacts.map((impact, i) => (
                    (impact.predicted_impacts?.length ?? 0) > 0 ? (
                      impact.predicted_impacts!.map((pred, j) => (
                        <tr key={i + '-' + j} className="border-t border-gray-700">
                          {j === 0 && (
                            <td className="px-2 py-1 align-top" rowSpan={impact.predicted_impacts!.length}>
                              {impact.start_time ? formatShortDateTime(impact.start_time) : '-'}
                            </td>
                          )}
                          <td className="px-2 py-1">{pred.location || '-'}</td>
                          <td className="px-2 py-1">{pred.impact_type || '-'}</td>
                          <td className="px-2 py-1">{pred.arrival_time ? formatShortDateTime(pred.arrival_time) : '-'}</td>
                          <td className="px-2 py-1 text-xs text-gray-400 hidden sm:table-cell">{pred.notification || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr key={i} className="border-t border-gray-700">
                        <td className="px-2 py-1 align-top">{impact.start_time ? formatShortDateTime(impact.start_time) : '-'}</td>
                        <td className="px-2 py-1" colSpan={4}>-</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>
      <Section title={`Flares [${events?.flares?.length || 0}]`} icon={<img src={flareIcon} width={32} height={32} alt="Flare" />}>
        {events?.flares && events.flares.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-700 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Start</th>
                  <th className="px-2 py-1">Stop</th>
                  <th className="px-2 py-1">Peak</th>
                  <th className="px-2 py-1">Class</th>
                  <th className="px-2 py-1">Location</th>
                </tr>
              </thead>
              <tbody>
                {events.flares.map((flare, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="px-2 py-1">{flare.date ? formatShortDateTime(flare.date) : '-'}</td>
                    <td className="px-2 py-1">{flare.start_time ? formatShortDateTime(flare.start_time) : '-'}</td>
                    <td className="px-2 py-1">{flare.stop_time ? formatShortDateTime(flare.stop_time) : '-'}</td>
                    <td className="px-2 py-1">{flare.peak_time ? formatShortDateTime(flare.peak_time) : '-'}</td>
                    <td className="px-2 py-1">{flare.class || '-'}</td>
                    <td className="px-2 py-1">{flare.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-gray-400">No flares reported.</div>}
      </Section>
      <Section title={`CMEs (Earth Directed) [${events?.cmes?.earth_directed?.length || 0}]`} icon={<img src={cmeIcon} width={32} height={32} alt="CME" />}>
        {events?.cmes?.earth_directed && events.cmes.earth_directed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-700 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-1">Start Time</th>
                  <th className="px-2 py-1">Speed</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Direction</th>
                  <th className="px-2 py-1">Half Angle Width</th>
                  <th className="px-2 py-1">Detecting Spacecraft</th>
                </tr>
              </thead>
              <tbody>
                {events.cmes.earth_directed.map((cme, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="px-2 py-1">{cme.start_time ? formatShortDateTime(cme.start_time) : '-'}</td>
                    <td className="px-2 py-1">{cme.speed?.value || '-'} {cme.speed?.unit || ''}</td>
                    <td className="px-2 py-1">{cme.type || '-'}</td>
                    <td className="px-2 py-1">{cme.direction || '-'}</td>
                    <td className="px-2 py-1">{cme.half_angle_width?.value || '-'} {cme.half_angle_width?.unit || ''}</td>
                    <td className="px-2 py-1">{cme.detecting_spacecraft || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-gray-400">No earth-directed CMEs reported.</div>}
      </Section>
      <Section title={`CMEs (Non-Earth Directed) [${events?.cmes?.non_earth_directed?.length || 0}]`} icon={<img src={cmeIcon} width={32} height={32} alt="CME" />}>
        {events?.cmes?.non_earth_directed && events.cmes.non_earth_directed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-700 rounded-lg">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-1">Start Time</th>
                  <th className="px-2 py-1">Speed</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Direction</th>
                  <th className="px-2 py-1">Half Angle Width</th>
                  <th className="px-2 py-1">Detecting Spacecraft</th>
                </tr>
              </thead>
              <tbody>
                {events.cmes.non_earth_directed.map((cme, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="px-2 py-1">{cme.start_time ? formatShortDateTime(cme.start_time) : '-'}</td>
                    <td className="px-2 py-1">{cme.speed?.value || '-'} {cme.speed?.unit || ''}</td>
                    <td className="px-2 py-1">{cme.type || '-'}</td>
                    <td className="px-2 py-1">{cme.direction || '-'}</td>
                    <td className="px-2 py-1">{cme.half_angle_width?.value || '-'} {cme.half_angle_width?.unit || ''}</td>
                    <td className="px-2 py-1">{cme.detecting_spacecraft || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-gray-400">No non-earth-directed CMEs reported.</div>}
      </Section>      
      <Section title="About" icon={<img src={summaryIcon} width={32} height={32} alt="Summary" />}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Source:</strong> {header?.source || '-'}</div>
          <div><strong>Type:</strong> {header?.message_type || '-'}</div>
          <div><strong>Issue Date:</strong> {header?.issue_date ? formatDateTime(header.issue_date) : '-'}</div>
          <div><strong>Coverage:</strong> {header?.coverage_begin_date ? formatDateTime(header.coverage_begin_date) : '-'} to {header?.coverage_end_date ? formatDateTime(header.coverage_end_date) : '-'}</div>
          <div><strong>Message ID:</strong> {header?.message_id || '-'}</div>
          <div className="col-span-2"><strong>Disclaimer:</strong> {header?.disclaimer || '-'}</div>
        </div>
      </Section>
      <Section title="Notes" icon={<img src={noteIcon} width={32} height={32} alt="Note" />}>
        <div className="text-xs text-yellow-200 whitespace-pre-line">{notes || 'No notes.'}</div>
      </Section>
    </div>
  );
};

export default DonkiAiReport; 