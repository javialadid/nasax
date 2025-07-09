import React from 'react';
import { breakParagraphs, firstSentence } from '../utils/stringutil';

const Explanation: React.FC<{ text: string }> = ({ text }) => {
  const first = firstSentence(text);
  const rest = text.slice(first.length).trim();

  return (
    <div
      className="w-full bg-gray-600/20 border border-gray-500/30 rounded-xl shadow-sm p-3 mt-1"
      style={{ wordBreak: 'break-word' }}
    >
      <h2 className="text-lg font-semibold mb-2 text-center">{first}</h2>
      {breakParagraphs(rest, 200).map((para, idx) => (
        <p key={idx} className="mb-4 last:mb-0 w-full max-w-full">{para}</p>
      ))}
    </div>
  );
};

export default Explanation;