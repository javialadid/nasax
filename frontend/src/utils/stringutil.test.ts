import { breakParagraphs, firstSentence, getChunkBetween, getChunkBetweenRegex } from '@/utils/stringutil';

describe('breakParagraphs', () => {
  it('splits at the first period after minLength, including the period', () => {
    const text = 'This is the first sentence. This is the second sentence. This is the third.';
    // minLength is set so the first period is after minLength
    const result = breakParagraphs(text, 10);
    expect(result).toEqual([
      'This is the first sentence.',
      'This is the second sentence.',
      'This is the third.'
    ]);
  });

  it('returns the whole text as one paragraph if no period after minLength', () => {
    const text = 'This is a sentence without any period after the minimum length';
    const result = breakParagraphs(text, 10);
    expect(result).toEqual([text]);
  });

  it('skips leading spaces in new paragraphs', () => {
    const text = 'First sentence.   Second sentence.  Third.';
    const result = breakParagraphs(text, 5);
    expect(result).toEqual([
      'First sentence.',
      'Second sentence.',
      'Third.'
    ]);
  });

  it('returns the whole text as one paragraph if it is short', () => {
    const text = 'Short.';
    const result = breakParagraphs(text, 10);
    expect(result).toEqual([text]);
  });

  it('returns empty array for empty string', () => {
    expect(breakParagraphs('', 10)).toEqual([]);
  });

  it('handles text with no periods at all', () => {
    const text = 'This is a text with no periods at all';
    const result = breakParagraphs(text, 10);
    expect(result).toEqual([text]);
  });
});

describe('firstSentence', () => {
  it('returns the first sentence ending with a period', () => {
    expect(firstSentence('Hello world. This is a test.')).toBe('Hello world.');
  });
  it('returns the first sentence ending with a question mark', () => {
    expect(firstSentence('Is this working? Yes it is.')).toBe('Is this working?');
  });
  it('returns the first sentence ending with an exclamation mark', () => {
    expect(firstSentence('Wow! That is cool.')).toBe('Wow!');
  });
  it('returns the first line if separated by newline', () => {
    expect(firstSentence('First line\nSecond line.')).toBe('First line');
  });
  it('returns the whole text if no sentence-ending punctuation', () => {
    expect(firstSentence('No punctuation here')).toBe('No punctuation here');
  });
  it('returns empty string for empty input', () => {
    expect(firstSentence('')).toBe('');
  });
});

describe('getChunkBetween', () => {
  it('returns the chunk between two strings', () => {
    expect(getChunkBetween('abcSTARTmiddleENDxyz', 'START', 'END')).toBe('middle');
  });
  it('returns null if start string is not found', () => {
    expect(getChunkBetween('abc', 'START', 'END')).toBeNull();
  });
  it('returns null if end string is not found', () => {
    expect(getChunkBetween('abcSTARTmiddle', 'START', 'END')).toBeNull();
  });
  it('returns null if any argument is missing', () => {
    expect(getChunkBetween('', 'START', 'END')).toBeNull();
    expect(getChunkBetween('abc', '', 'END')).toBeNull();
    expect(getChunkBetween('abc', 'START', '')).toBeNull();
  });
});

describe('getChunkBetweenRegex', () => {
  it('returns the chunk between two strings using regex', () => {
    expect(getChunkBetweenRegex('abcSTARTmiddleENDxyz', 'START', 'END')).toBe('middle');
  });
  it('returns null if start string is not found', () => {
    expect(getChunkBetweenRegex('abc', 'START', 'END')).toBeNull();
  });
  it('returns null if end string is not found', () => {
    expect(getChunkBetweenRegex('abcSTARTmiddle', 'START', 'END')).toBeNull();
  });
  it('returns null if any argument is missing', () => {
    expect(getChunkBetweenRegex('', 'START', 'END')).toBeNull();
    expect(getChunkBetweenRegex('abc', '', 'END')).toBeNull();
    expect(getChunkBetweenRegex('abc', 'START', '')).toBeNull();
  });
  it('handles special regex characters in delimiters', () => {
    expect(getChunkBetweenRegex('a[START]b[END]c', '[START]', '[END]')).toBe('b');
  });
}); 