import { cacheKeyFromUrl } from './cache';

describe('cacheKeyFromUrl', () => {
  const cases = [
    // Basic normalization
    ['HTTP://EXAMPLE.COM/Path/', 'http://example.com/path'],
    ['http://example.com/path?b=2&a=1', 'http://example.com/path?a=1&b=2'],
    ['http://example.com:80/path', 'http://example.com/path'],
    ['https://example.com:443/path', 'https://example.com/path'],
    ['http://example.com//foo//bar//', 'http://example.com/foo/bar'],
    // Query param order
    ['http://example.com/path?a=1&b=2', 'http://example.com/path?a=1&b=2'],
    ['http://example.com/path?b=2&a=1', 'http://example.com/path?a=1&b=2'],
    // Trailing slashes
    ['http://example.com/path/', 'http://example.com/path'],
    ['http://example.com/path////', 'http://example.com/path'],
    // Duplicate slashes
    ['http://example.com//foo//bar', 'http://example.com/foo/bar'],
    // Default ports
    ['http://example.com:80/', 'http://example.com'],
    ['https://example.com:443/', 'https://example.com'],
    // Non-default ports
    ['http://example.com:8080/', 'http://example.com:8080'],
    // Upper/lower case
    ['HTTP://EXAMPLE.COM/ABC', 'http://example.com/abc'],
    // No protocol
    ['example.com/path', 'example.com/path'],
    // Invalid URL
    ['not a url', 'not a url'],
    // Empty string
    ['', ''],
    // Query with repeated params
    ['http://example.com/path?a=1&a=2', 'http://example.com/path?a=1&a=2'],
    // Query with special characters
    ['http://example.com/path?x=%20%2F', 'http://example.com/path?x=+%2F'],
  ];

  it.each(cases)('normalizes %s', (input, expectedStart) => {
    const result = cacheKeyFromUrl(input);
    if (!result.startsWith(expectedStart)) {
      throw new Error(`\nInput: ${input}\nExpected start: ${expectedStart}\nActual: ${result}`);
    }
  });

  it('is stable under stress', () => {
    // Generate 1000 URLs with random query param order and casing
    const base = 'http://EXAMPLE.com:80/Some/Path/';
    const params = ['a=1', 'b=2', 'c=3', 'd=4'];
    const results = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const shuffled = params.sort(() => Math.random() - 0.5);
      const url = `${base}?${shuffled.join('&')}`;
      results.add(cacheKeyFromUrl(url));
    }
    // All should normalize to the same key
    expect(results.size).toBe(1);
  });
    
  
}); 

describe('cacheKeyFromUrl error handling', () => {
	it('throws an error for null input', () => {
	  expect(() => cacheKeyFromUrl(null as any)).toThrow();
	});
  
	it('throws an error for undefined input', () => {
	  expect(() => cacheKeyFromUrl(undefined as any)).toThrow();
	});
  });