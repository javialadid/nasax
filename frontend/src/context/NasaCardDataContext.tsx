import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { InsightWeatherApiResponse } from '@/types/marsWeather';

// Types for each card's data
type ApodData = any; // Replace with a more specific type if available
type RoversData = any; // Replace with a more specific type if available
type DonkiData = any[]; // Always an array


// New APOD/EPIC context type for multiple dates
interface ApodDateEntry {
  data: ApodData | null;
  empty: boolean;
}
interface EpicDateEntry {
  data: any | null;
  empty: boolean;
}

// InSight Mars Weather context type
interface InsightWeatherEntry {
  data: InsightWeatherApiResponse | null;
  empty: boolean;
}

interface NasaCardDataContextType {
  apodByDate: { [date: string]: ApodDateEntry };
  setApodDataForDate: (date: string, data: ApodData) => void;
  setApodEmptyForDate: (date: string) => void;
  epicByDate: { [date: string]: EpicDateEntry };
  setEpicDataForDate: (date: string, data: any) => void;
  setEpicEmptyForDate: (date: string) => void;
  availableEpicDates: string[];
  setAvailableEpicDates: (dates: string[]) => void;
  roversData: RoversData[];
  setRoversData: (data: RoversData[]) => void;
  donkiData: DonkiData;
  setDonkiData: (data: DonkiData) => void;
  insightWeather: InsightWeatherEntry;
  setInsightWeather: (data: InsightWeatherApiResponse) => void;
  setInsightWeatherEmpty: () => void;
  clearAll: () => void;
}

const NasaCardDataContext = createContext<NasaCardDataContextType | undefined>(undefined);

export const NasaCardDataProvider = ({ children }: { children: ReactNode }) => {
  const [apodByDate, setApodByDate] = useState<{ [date: string]: ApodDateEntry }>({});
  const [epicByDate, setEpicByDate] = useState<{ [date: string]: EpicDateEntry }>({});
  const [availableEpicDates, setAvailableEpicDates] = useState<string[]>([]);
  const [roversData, setRoversData] = useState<RoversData[]>([]);
  const [donkiData, _setDonkiData] = useState<DonkiData>([]);
  const setDonkiData = (data: DonkiData) => {
    _setDonkiData(data);
  };
  const [insightWeather, setInsightWeatherState] = useState<InsightWeatherEntry>({ data: null, empty: false });

  const setInsightWeather = (data: InsightWeatherApiResponse) => {
    setInsightWeatherState({ data, empty: false });
  };
  const setInsightWeatherEmpty = () => {
    setInsightWeatherState({ data: null, empty: true });
  };

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
    setDonkiData([]);
    setInsightWeatherState({ data: null, empty: false });
  };

  return (
    <NasaCardDataContext.Provider value={{ apodByDate, setApodDataForDate, setApodEmptyForDate, epicByDate, setEpicDataForDate, setEpicEmptyForDate, availableEpicDates, setAvailableEpicDates, roversData, setRoversData, donkiData, setDonkiData, insightWeather, setInsightWeather, setInsightWeatherEmpty, clearAll }}>
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