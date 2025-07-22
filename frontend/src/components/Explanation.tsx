import React from 'react';
import { breakParagraphs, firstSentence } from '@/utils/stringutil';
import TextToSpeechPlayer from './TextToSpeechPlayer';

const Explanation: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  const first = firstSentence(text);
  const rest = text.slice(first.length).trim();

  return (
    <div
      className={`${className} w-full bg-gray-800/20 border border-gray-500/30 rounded-xl shadow-sm p-3 mt-1`}
      style={{ wordBreak: 'break-word' }}
    >
      <TextToSpeechPlayer text={text} />
      <div className="mb-2 w-full">
        <span className="text-sm landscape:text-sm landscape:sm:text-base  sm:text-lg font-semibold text-blue-100/90">{first}</span>
      </div>
      {breakParagraphs(rest, 200).map((para, idx) => (
        <p key={idx} className="mb-4 last:mb-0 w-full max-w-full">{para}</p>
      ))}
    </div>
  );
};

export default Explanation;