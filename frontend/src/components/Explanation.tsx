import React from 'react';
import { breakParagraphs } from '../utils/stringutil';

const Explanation: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-2 p-0 text-base leading-relaxed">
    {breakParagraphs(text, 200).map((para, idx) => (
      <p key={idx} className="mb-4 last:mb-0">{para}</p>
    ))}
  </div>
);

export default Explanation;