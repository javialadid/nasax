import React from 'react';

type ReportRendererProps = {
  text: string;
};

function formatDate(dateStr: string) {
  // Handles both YYYY-MM-DDTHH:MMZ and YYYY-MM-DDTHH:MM:SSZ
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)Z?/);
  if (!match) return dateStr;
  const [_, date, time] = match;
  const d = new Date(`${date}T${time}Z`);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }) + ' UTC';
}

const parseSections = (text: string) => {
  const lines = text.split('\n');
  const sections: { title: string; content: string[] }[] = [];

  let currentSection = { title: '', content: [] as string[] };

  for (const line of lines) {
    // Only treat as section header if not Outlook Coverage Begin/End Date
    const sectionMatch = line.match(/^##\s*(.*)/);
    if (
      sectionMatch &&
      !/^Outlook Coverage (Begin|End) Date/i.test(sectionMatch[1].trim())
    ) {
      if (currentSection.title || currentSection.content.length) {
        sections.push(currentSection);
      }
      currentSection = { title: sectionMatch[1].trim(), content: [] };
    } else {
      currentSection.content.push(line);
    }
  }

  if (currentSection.title || currentSection.content.length) {
    sections.push(currentSection);
  }

  return sections;
};

const isMarkdownTable = (line: string) =>
  /^\s*\|/.test(line) || (line.trim().split('|').length > 1 && line.includes('|'));

const parseMarkdownTable = (lines: string[]) => {
  const rows = lines
    .filter(isMarkdownTable)
    .map((line) => {
      let l = line.trim();
      if (!l.startsWith('|')) l = '|' + l;
      if (!l.endsWith('|')) l = l + '|';
      return l
        .split('|')
        .slice(1, -1)
        .map((cell) => simplifyDate(cell.trim()));
    });

  const [header, ...body] = rows;
  return { header, body };
};

const simplifyDate = (text: string): string => {
  // Example: 2014-05-06T22:17Z → 05-06 22:17
  return text.replace(/(\d{4})-(\d{2})-(\d{2})[T ]?(\d{2}:\d{2}(?::\d{2})?)?Z?/g, (_, y, m, d, t) =>
    t ? `${m}-${d} ${t}` : `${m}-${d}`
  );
};

const ReportRenderer: React.FC<ReportRendererProps> = ({ text }) => {
  // Extract and format Begin Date and End Date at the top
  const beginDateMatch = text.match(/Begin Date:\s*([\dT:-]+Z?)/);
  const endDateMatch = text.match(/End Date:\s*([\dT:-]+Z?)/);
  const beginDate = beginDateMatch ? formatDate(beginDateMatch[1]) : '';
  const endDate = endDateMatch ? formatDate(endDateMatch[1]) : '';

  const sections = parseSections(text);

  return (
    <div className="space-y-8 p-6 bg-zinc-900 text-zinc-100 min-h-screen font-mono">
      {(beginDate || endDate) && (
        <div className="mb-4 flex flex-row gap-8 text-lg font-semibold text-gray-200">
          {beginDate && <span>Begin Date: <span className="font-mono">{beginDate}</span></span>}
          {endDate && <span>End Date: <span className="font-mono">{endDate}</span></span>}
        </div>
      )}
      {sections.map((section, idx) => {
        const contentLines = section.content;

        const tableStartIndex = contentLines.findIndex(isMarkdownTable);
        let beforeTable = contentLines;
        let tableLines: string[] = [];

        if (tableStartIndex !== -1) {
          beforeTable = contentLines.slice(0, tableStartIndex);
          tableLines = contentLines.slice(tableStartIndex);
        }

        const table = tableLines.length ? parseMarkdownTable(tableLines) : null;

        return (
          <section key={idx} className="bg-zinc-800 p-5 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold mb-4 border-b border-zinc-700 pb-2">{section.title}</h2>

            {beforeTable
              .filter((line) => line.trim())
              .map((line, i) => (
                <p key={i} className="mb-2 leading-relaxed text-zinc-300">
                  {simplifyDate(line.trim())}
                </p>
              ))}

            {table && (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full border border-zinc-700 text-sm text-left">
                  <thead className="bg-zinc-700 text-zinc-200">
                    <tr>
                      {table.header.map((h, i) => (
                        <th key={i} className="border border-zinc-700 px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.body.map((row, ri) => (
                      <tr key={ri} className="even:bg-zinc-800 odd:bg-zinc-900">
                        {row.map((cell, ci) => (
                          <td key={ci} className="border border-zinc-700 px-3 py-2 whitespace-nowrap text-zinc-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ReportRenderer;
