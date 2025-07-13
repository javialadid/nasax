import React, { useMemo } from 'react';
import styled from 'styled-components';

// Props interface
interface SpaceWeatherReportProps {
  text: string;
}

// Styled components for nice presentation
const ReportContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
`;

const SectionHeading = styled.h2`
  color: #1a1a1a;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin-top: 30px;
`;

const SubHeading = styled.h3`
  color: #333;
  margin-top: 20px;
`;

const Paragraph = styled.p`
  margin: 10px 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  overflow-x: auto;
  display: block;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

// Main component
const SpaceWeatherReport: React.FC<SpaceWeatherReportProps> = ({ text }) => {
  // Memoize parsing to avoid re-parsing on every render
  const parsedSections = useMemo(() => parseText(text), [text]);

  return (
    <ReportContainer>
      {parsedSections.map((section, index) => (
        <div key={index}>
          <SectionHeading>{section.title}</SectionHeading>
          {section.content.map((item, itemIndex) => {
            if (item.type === 'paragraph') {
              return <Paragraph key={itemIndex}>{item.data}</Paragraph>;
            }
            if (item.type === 'subheading') {
              return <SubHeading key={itemIndex}>{item.data}</SubHeading>;
            }
            if (item.type === 'table') {
              return (
                <Table key={itemIndex}>
                  <thead>
                    <tr>
                      {item.headers.map((header, hIndex) => (
                        <th key={hIndex}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.rows.map((row, rIndex) => (
                      <tr key={rIndex}>
                        {row.map((cell, cIndex) => (
                          <td key={cIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              );
            }
            return null;
          })}
        </div>
      ))}
    </ReportContainer>
  );
};

// Parsing logic
interface Section {
  title: string;
  content: Array<
    | { type: 'paragraph'; data: string }
    | { type: 'subheading'; data: string }
    | { type: 'table'; headers: string[]; rows: string[][] }
  >;
}

function parseText(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n').map((line) => line.trim());

  let currentSection: Section | null = null;
  let currentContentBlock: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushContentBlock = () => {
    if (currentContentBlock.length > 0 && currentSection) {
      const blockText = currentContentBlock.join(' ').trim();
      if (blockText) {
        currentSection.content.push({ type: 'paragraph', data: blockText });
      }
      currentContentBlock = [];
    }
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 && tableRows.length > 0 && currentSection) {
      currentSection.content.push({ type: 'table', headers: tableHeaders, rows: tableRows });
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  lines.forEach((line) => {
    if (line.startsWith('##')) {
      flushContentBlock();
      flushTable();
      const title = line.replace('##', '').trim().replace(':', '');
      currentSection = { title, content: [] };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) return;

    if (!line) {
      flushContentBlock();
      return;
    }

    // Detect subheadings (e.g., "Flares (M-class and above)", "Earth directed:")
    if (
      line.endsWith(':') &&
      !line.includes(' ') && // Rough heuristic: subheadings are short and end with :
      !inTable
    ) {
      flushContentBlock();
      flushTable();
      currentSection.content.push({ type: 'subheading', data: line.replace(':', '').trim() });
      return;
    }

    // Detect table start (header line with multiple words, followed by data rows)
    if (!inTable && line.split(/\s{2,}/).length > 1) { // More than one column
      flushContentBlock();
      inTable = true;
      tableHeaders = line.split(/\s{2,}/).filter(Boolean); // Split on multiple spaces
      return;
    }

    if (inTable) {
      const cells = line.split(/\s{2,}/).filter(Boolean);
      if (cells.length >= tableHeaders.length - 1) { // Allow slight mismatch for robustness
        tableRows.push(cells);
      } else {
        // End of table if line doesn't match
        flushTable();
        currentContentBlock.push(line);
      }
      return;
    }

    // Default: add to paragraph block
    currentContentBlock.push(line);
  });

  flushContentBlock();
  flushTable();

  return sections;
};

export default SpaceWeatherReport;