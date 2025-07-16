import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for each card's data
type ApodData = any; // Replace with a more specific type if available
type RoversData = any; // Replace with a more specific type if available
type DonkiData = any; // Replace with a more specific type if available
// Epic card is static, so no data needed

interface NasaCardDataContextType {
  apodData: ApodData | null;
  setApodData: (data: ApodData) => void;
  roversData: RoversData[];
  setRoversData: (data: RoversData[]) => void;
  donkiData: DonkiData | null;
  setDonkiData: (data: DonkiData) => void;
  clearAll: () => void;
}

const NasaCardDataContext = createContext<NasaCardDataContextType | undefined>(undefined);

export const NasaCardDataProvider = ({ children }: { children: ReactNode }) => {
  const [apodData, setApodData] = useState<ApodData | null>(null);
  const [roversData, setRoversData] = useState<RoversData[]>([]);
  const [donkiData, setDonkiData] = useState<DonkiData | null>(null);

  const clearAll = () => {
    setApodData(null);
    setRoversData([]);
    setDonkiData(null);
  };

  return (
    <NasaCardDataContext.Provider value={{ apodData, setApodData, roversData, setRoversData, donkiData, setDonkiData, clearAll }}>
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