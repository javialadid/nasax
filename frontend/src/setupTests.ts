import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

jest.mock('./utils/env', () => ({
	getApiBaseUrl: () => 'http://localhost:3000',
  getMaxDaysBackEpic: () => 7,
}));