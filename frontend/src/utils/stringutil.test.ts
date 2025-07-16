import { breakParagraphs } from '@/utils/stringutil';

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