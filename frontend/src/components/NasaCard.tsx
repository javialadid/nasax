import React, { useState } from 'react';
import { useNasaApi } from '../hooks/useNasaApi';
import * as Dialog from '@radix-ui/react-dialog';

interface NasaCardProps {
  endpoint: string;
  params?: Record<string, string>;
  render?: (data: any, expanded: boolean) => React.ReactNode;
  expanded?: boolean;
  setExpanded?: (open: boolean) => void;
}

/** Encapsulates basic structure of the cards. Allows passing expanded state so the children 
 * can control card expansion
 */
const NasaCard: React.FC<NasaCardProps> = ({ endpoint, params = {}, render, 
expanded: expandedProp, setExpanded: setExpandedProp }) => {
  
  const { data, loading, error } = useNasaApi(endpoint, params);
  const [internalExpanded, internalSetExpanded] = useState(false);
  const expanded = expandedProp !== undefined ? expandedProp : internalExpanded;
  const setExpanded = setExpandedProp || internalSetExpanded;

  if (!endpoint) {
    return (
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <div
            className="relative aspect-[4/3] w-full rounded-xl shadow-lg border border-gray-800/10 dark:border-gray-200/10 cursor-pointer overflow-hidden group bg-white/10 flex items-center justify-center"
            tabIndex={0}
            role="button"
            aria-expanded={false}
          >
            <img
              src="/logo-nasax_192.png"
              alt="NASA Explorer Logo"
              className="w-32 h-32 object-contain opacity-80"
            />
          </div>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Dialog.Content
            className="fixed z-50 left-1/2 -translate-x-1/2 top-[40px] h-[calc(92vh-40px)] w-full max-w-2xl bg-gray-900 text-[var(--color-text)] rounded-xl shadow-2xl p-6 overflow-hidden flex flex-col items-center justify-center"
            style={{ borderRadius: '1rem' }}
          >
            <Dialog.Title asChild>
              <h2 className="text-2xl sm:text-3xl bg-gray-900/70 font-bold mb-6 text-center px-2 pt-2 relative z-10">NASA Explorer</h2>
            </Dialog.Title>
            <div className="absolute top-2 right-4 z-20">
              <Dialog.Close asChild>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/80 border border-gray-700 text-white text-2xl font-light hover:bg-gray-700/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Close"
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <img
              src='/logo-nasax_192.png'
              alt="NASA Explorer Logo Large"
              className="w-48 h-48 object-contain  mb-6"
            />
            <div className="text-lg opacity-80 text-center max-w-2xl px-2">Welcome to NASA Explorer! Select a card to explore NASA data.</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  if (loading) return <div className="aspect-[4/3] w-full flex items-center justify-center bg-white/10 rounded-xl text-2xl">Loading...</div>;
  if (error) return <div className="aspect-[4/3] w-full flex items-center justify-center bg-red-200/30 rounded-xl text-red-700 text-xl">Error: {error.message}</div>;
  if (!data) return null;

  return (
    <Dialog.Root open={expanded} onOpenChange={setExpanded}>
      <Dialog.Trigger asChild>
        <div
          className="relative aspect-[4/3] w-full rounded-xl shadow-lg border border-gray-800/10 dark:border-gray-200/10 cursor-pointer overflow-hidden group"
          tabIndex={0}
          role="button"
          aria-expanded={expanded}
        >
          {render ? render(data, false) : (
            <>
              {data.url && data.media_type === 'image' && (
                <img src={data.hdurl} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />
              )}
              {data.media_type === 'video' && data.url && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60">
                  <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-2xl z-10">View Video</a>
                </div>
              )}
              <div className="absolute top-0 left-0 w-full bg-gray-900/70 text-white text-lg font-semibold px-3 py-2 text-center z-10 truncate">
                {data.title || 'NASA Card'}
              </div>
            </>
          )}
        </div>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          className="fixed z-50 left-1/2 -translate-x-1/2 top-[40px] h-[calc(92vh-40px)] w-full max-w-6xl bg-gray-900 text-[var(--color-text)] rounded-xl shadow-2xl p-6 overflow-hidden flex flex-col items-center"
          style={{ borderRadius: '1rem' }}
        >          
          <Dialog.Title asChild>
            <h2 className="text-2xl sm:text-3xl bg-gray-900/70 font-bold mb-6 text-center px-2 pt-2 relative z-10">{data.title || 'NASA Card'}</h2>
          </Dialog.Title>
          <div className="absolute top-2 right-4 z-20">
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/80 border border-gray-700 text-white text-2xl font-light hover:bg-gray-700/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Close"
              >
                ×
              </button>
            </Dialog.Close>
          </div>
          {render ? render(data, true) : (
            <>
              {!render && data.url && data.media_type === 'image' && (
                <img src={data.url} alt={data.title} className="max-h-[40vh] object-contain rounded mb-6 flex-shrink-0" style={{ maxWidth: '100%' }} />
              )}
              {data.media_type === 'video' && data.url && (
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline mb-6">View Video</a>
              )}
              <Dialog.Description asChild>
                <div className="text-lg opacity-90 text-center max-w-3xl overflow-y-auto flex-1 px-2">{data.explanation}</div>
              </Dialog.Description>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default NasaCard;