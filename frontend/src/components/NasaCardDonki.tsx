import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNasaApi } from '../hooks/useNasaApi';
import { firstSentence, getChunkBetween } from '../utils/stringutil';
import { getEasternDateString, addDays } from '../utils/dateutil';
import { useNasaCardData } from '../NasaCardDataContext';

const DEFAULT_IMAGE = '/donki_card.png';
const DEFAULT_TITLE = 'DONKI Report';
const CARD_IMG_WIDTH = 400;
const CARD_IMG_HEIGHT = 300;
const API_ENDPOINT = 'DONKI/notifications';

const today = getEasternDateString();
const lastWeek = addDays(today, -7);
const API_PARAMS = {
  startDate: lastWeek,
  endDate: today,
  type: 'all',
};

const NasaCardDonki: React.FC = () => {
  const { donkiData, setDonkiData } = useNasaCardData();
  // Only fetch if donkiData is not present
  const shouldFetch = !donkiData;
  const { data, loading: apiLoading, error } = useNasaApi(API_ENDPOINT, API_PARAMS, { enabled: shouldFetch });
  const [loading, setLoading] = useState(shouldFetch);
  const [notification, setNotification] = useState<any>(donkiData);
  const [noRecentData, setNoRecentData] = useState(false);

  useEffect(() => {
    if (donkiData) {
      setNotification(donkiData);
      setLoading(false);
      setNoRecentData(false);
      return;
    }
    if (!apiLoading && Array.isArray(data)) {
      // Find the first notification with a messageBody
      const found = data.find((notif: any) => notif && notif.messageBody);
      setNotification(found || null);
      setDonkiData(found || null);
      setNoRecentData(!found);
      setLoading(false);
    }
    if (!apiLoading && !Array.isArray(data)) {
      setNotification(null);
      setDonkiData(null);
      setNoRecentData(true);
      setLoading(false);
    }
    if (apiLoading && !donkiData) {
      setLoading(true);
    }
  }, [data, apiLoading, donkiData, setDonkiData]);

  const issueDate = notification && notification.messageIssueTime ? notification.messageIssueTime.split('T')[0] : '';
  const cardTitle = `${DEFAULT_TITLE}${issueDate ? ` (${issueDate})` : ''}`;
  let summary = notification && notification.messageBody ? getChunkBetween(notification.messageBody, '## Summary:', '#') : '';
  if (!summary && notification && notification.messageBody) {
    // fallback: try to get everything after 'Summary:'
    const idx = notification.messageBody.indexOf('## Summary:');
    if (idx !== -1) summary = notification.messageBody.slice(idx + 8).split('\n')[0];
  }
  const cardSubtitle = summary ? firstSentence(summary.trim()) : '';

  return (
    <Link to="/donki" style={{ textDecoration: 'none' }}>
      <div
        className="card relative aspect-[4/3] w-full border-1 border-gray-500 rounded-xl overflow-hidden cursor-pointer shadow-lg group"
        tabIndex={0}
        role="button"
        aria-label={DEFAULT_TITLE}
        style={{ boxShadow: "-6px 7px 7px #ffffff0f" }}
      >
        <img
          src={DEFAULT_IMAGE}
          alt={DEFAULT_TITLE}
          width={CARD_IMG_WIDTH}
          height={CARD_IMG_HEIGHT}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Always show the default title at the top */}
        <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-lg font-semibold px-3 py-2 text-center truncate z-10">
          {cardTitle}
        </div>
        {/* When data is loaded, show notification type and summary at the bottom */}
        {notification && !noRecentData && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="text-xs text-gray-300 mt-1">{cardSubtitle}</div>
          </div>
        )}
        {noRecentData && !loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">No DONKI notification found.</div>
          </div>
        )}
        {loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-gray-100 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">Loading...</div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute bottom-0 left-0 w-full bg-black/70 text-red-400 text-xs px-3 py-2 text-center z-10">
            <div className="font-semibold text-base truncate">{typeof error === 'object' && 'message' in error ? error.message : String(error)}</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NasaCardDonki; 