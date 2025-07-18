import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for each card's data
type ApodData = any; // Replace with a more specific type if available
type RoversData = any; // Replace with a more specific type if available
type DonkiData = any; // Replace with a more specific type if available
// Epic card is static, so no data needed

// New APOD/EPIC context type for multiple dates
interface ApodDateEntry {
  data: ApodData | null;
  empty: boolean;
}
interface EpicDateEntry {
  data: any | null;
  empty: boolean;
}

interface NasaCardDataContextType {
  apodByDate: { [date: string]: ApodDateEntry };
  setApodDataForDate: (date: string, data: ApodData) => void;
  setApodEmptyForDate: (date: string) => void;
  epicByDate: { [date: string]: EpicDateEntry };
  setEpicDataForDate: (date: string, data: any) => void;
  setEpicEmptyForDate: (date: string) => void;
  roversData: RoversData[];
  setRoversData: (data: RoversData[]) => void;
  donkiData: DonkiData | null;
  setDonkiData: (data: DonkiData) => void;
  clearAll: () => void;
}

const NasaCardDataContext = createContext<NasaCardDataContextType | undefined>(undefined);

export const NasaCardDataProvider = ({ children }: { children: ReactNode }) => {
  const [apodByDate, setApodByDate] = useState<{ [date: string]: ApodDateEntry }>({});
  const [epicByDate, setEpicByDate] = useState<{ [date: string]: EpicDateEntry }>({});
  const [roversData, setRoversData] = useState<RoversData[]>([]);
  const [donkiData, setDonkiData] = useState<DonkiData | null>(null);

  const setApodDataForDate = (date: string, data: ApodData) => {
    setApodByDate(prev => ({
      ...prev,
      [date]: { data, empty: false },
    }));
  };

  const setApodEmptyForDate = (date: string) => {
    setApodByDate(prev => ({
      ...prev,
      [date]: { data: null, empty: true },
    }));
  };

  const setEpicDataForDate = (date: string, data: any) => {
    setEpicByDate(prev => ({
      ...prev,
      [date]: { data, empty: false },
    }));
  };

  const setEpicEmptyForDate = (date: string) => {
    setEpicByDate(prev => ({
      ...prev,
      [date]: { data: null, empty: true },
    }));
  };

  const clearAll = () => {
    setApodByDate({});
    setEpicByDate({});
    setRoversData([]);
    setDonkiData(null);
  };

  return (
    <NasaCardDataContext.Provider value={{ apodByDate, setApodDataForDate, setApodEmptyForDate, epicByDate, setEpicDataForDate, setEpicEmptyForDate, roversData, setRoversData, donkiData, setDonkiData, clearAll }}>
      {children}
    </NasaCardDataContext.Provider>
  );
};

export const useNasaCardData = () => {
  const context = useContext(NasaCardDataContext);
  if (!context) {
    throw new Error('useNasaCardData must be used within a NasaCardDataProvider');
  }
  return context;
}; 