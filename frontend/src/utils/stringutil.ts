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

export const firstSentence = ( text: string ) => {
	if (!text) return '';
	const firstPeriod = text.indexOf('.');
	if (firstPeriod === -1) return text;
	return text.slice(0, firstPeriod + 1) ;
  }