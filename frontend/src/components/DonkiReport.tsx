import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import SpaceWeatherReport from './TestWeather';
import ReportRenderer from './Test2';

interface ReportProps {
  rawContent: string;
}

function convertSpaceTablesToMarkdown(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Detect a table header: at least 2 consecutive spaces, not empty, not a section header
    if (
      line.trim() &&
      (lines[i + 1] && lines[i + 1].match(/\s{2,}/)) &&
      line.match(/\s{2,}/)
    ) {
      // Start of a table
      const header = line.trim();
      const tableRows: string[] = [];
      i++;
      // Collect table rows
      while (i < lines.length && lines[i].match(/\s{2,}/)) {
        tableRows.push(lines[i].trim());
        i++;
      }
      // Convert header and rows to markdown table
      const headerCells = header.split(/\s{2,}/).map(cell => cell.trim());
      const headerLine = '| ' + headerCells.join(' | ') + ' |';
      const separatorLine = '| ' + headerCells.map(() => '---').join(' | ') + ' |';
      const rowLines = tableRows.map(row => {
        const cells = row.split(/\s{2,}/).map(cell => cell.trim());
        return '| ' + cells.join(' | ') + ' |';
      });
      result.push(headerLine, separatorLine, ...rowLines);
    } else {
      result.push(line);
      i++;
    }
  }
  return result.join('\n');
}

function preprocessDonkiContent(rawContent: string) {
  // 0. fix broken md
  rawContent = rawContent.replace(/##(\w)\s/g, '## $1');
  // 1. Split at '## Summary'
  const summaryIdx = rawContent.indexOf('## Summary');
  let header = '';
  let content = rawContent;
  if (summaryIdx !== -1) {
    header = rawContent.slice(0, summaryIdx);
    content = rawContent.slice(summaryIdx);
  }

  // 2. Extract Begin Date and End Date from header
  let beginDate = '';
  let endDate = '';
  const beginMatch = header.match(/Begin Date\s*:? *(.*)/i);
  const endMatch = header.match(/End Date\s*:? *(.*)/i);
  if (beginMatch) beginDate = beginMatch[1].trim();
  if (endMatch) endDate = endMatch[1].trim();

  // 3. Remove lines with 'Begin Date' or 'End Date' from content (shouldn't be needed, but just in case)
  // (skipped, as per your last edit)

  // 4. Table logic (space-aligned tables to markdown tables)
  content = convertSpaceTablesToMarkdown(content);

  return { beginDate, endDate, content };
}

export const DonkiReport: React.FC<ReportProps> = ({ rawContent }) => {
  const { beginDate, endDate, content } = preprocessDonkiContent(rawContent);

  return (
    <div className="flex flex-col w-full h-full min-h-0 flex-1 overflow-hidden">
      <div className="max-w-3xl p-4 mx-auto bg-gray-900 border border-gray-700 shadow rounded-xl space-y-4 h-full min-h-0 flex flex-col">
        {(beginDate || endDate) && (
          <div className="mb-4 flex flex-row gap-8 text-lg font-semibold text-gray-200">
            {beginDate && <span>Begin Date: <span className="font-mono">{beginDate}</span></span>}
            {endDate && <span>End Date: <span className="font-mono">{endDate}</span></span>}
          </div>
        )}
        <ReportRenderer text={content}/>
        <div className="prose prose-invert flex-1 min-h-0 overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};