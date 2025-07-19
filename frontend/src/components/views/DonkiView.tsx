import React, { useEffect } from 'react';
import { useNasaApi } from '@/hooks/useNasaApi';
import { getEasternDateString, addDays } from '@/utils/dateutil';
import DonkiAiReport from '@components/DonkiAiReport';
import SpinnerOverlay from '@components/SpinnerOverlay';
import { useNasaCardData } from '@/NasaCardDataContext';

const API_ENDPOINT = 'DONKI/notifications';
const today = getEasternDateString();
const lastWeek = addDays(today, -7);
const API_PARAMS = {
  startDate: lastWeek,
  endDate: today,
  type: 'all',
};

const DonkiNotificationsView: React.FC = () => {
  const { donkiData, setDonkiData } = useNasaCardData();
  const shouldFetch = donkiData.length === 0;
  const { data, loading, error } = useNasaApi(API_ENDPOINT, API_PARAMS, { enabled: shouldFetch });

  // On successful fetch, store in context
  useEffect(() => {
    if (shouldFetch && data && !loading && !error) {
      setDonkiData(data);
    }
  }, [shouldFetch, data, loading, error, setDonkiData]);

  // Normalize donkiData to always be an array
  const normalizedDonkiData = Array.isArray(donkiData)
    ? donkiData
    : donkiData
      ? [donkiData]
      : [];

  const sourceData = normalizedDonkiData.length > 0
    ? normalizedDonkiData
    : Array.isArray(data)
      ? data
      : [];

  const reports = sourceData.filter((n: any) => n.messageType === 'Report');

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto min-h-0 h-full flex-1 py-2 px-2 overflow-auto">
      
      {shouldFetch && loading && <SpinnerOverlay />}
      {shouldFetch && error && <div className="text-center text-red-500 text-lg">{typeof error === 'object' && 'message' in error ? error.message : String(error)}</div>}
      {!loading && !error && reports.length === 0 && (
        <div className="text-center text-gray-400 text-lg">No reports found.</div>
      )}
      <div className="flex flex-col gap-6">
        {reports.map((notif: any, idx: number) => (
          <div key={notif.messageIssueTime || idx}>
            {notif.processedMessage && <DonkiAiReport data={notif.processedMessage} />}
            {!notif.processedMessage && <div>No Data. Try again later.</div> }
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonkiNotificationsView; 