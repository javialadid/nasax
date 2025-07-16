export const breakParagraphs = (text: string, minLength: number): string[] => {
	const paragraphs = [];
	let i = 0;
	while (i < text.length) {
	  let end = i + minLength;
	  if (end < text.length) {
		// Find the next period after minLength
		let nextPeriod = text.indexOf('.', end);
		if (nextPeriod !== -1) {
		  end = nextPeriod + 1; // Include the period
		} else {
		  end = text.length;
		}
	  } else {
		end = text.length;
	  }
	  paragraphs.push(text.slice(i, end).trim());
	  i = end;
	  // Skip any whitespace at the start of the next paragraph
	  while (text[i] === ' ') i++;
	}
	return paragraphs.filter(Boolean);
  };

export const firstSentence = (text: string) => {
  if (!text) return '';
  const idx = text.search(/[.!?\n]/);
  if (idx !== -1) return text.slice(0, idx + (text[idx] === '\n' ? 0 : 1)).trim();
  return text;
}

export const getChunkBetween = (fullString: string, startString: string, endString: string): string | null => {
  if (!fullString || !startString || !endString) {
    return null;
  }

  const startIndex = fullString.indexOf(startString);
  if (startIndex === -1) {
    return null; // Start string not found
  }

  const chunkStartIndex = startIndex + startString.length;
  const endIndex = fullString.indexOf(endString, chunkStartIndex);

  if (endIndex === -1) {
    return null; // End string not found after start string
  }

  return fullString.substring(chunkStartIndex, endIndex);
};

export const getChunkBetweenRegex = (
	fullString: string,
	startString: string,
	endString: string
  ): string | null => {
	if (!fullString || !startString || !endString) return null;
  
	// Escape special regex characters in startString and endString
	const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(
	  `${escape(startString)}([\\s\\S]*?)${escape(endString)}`
	);
	const match = fullString.match(pattern);
  
	return match ? match[1] : null;
  };
  