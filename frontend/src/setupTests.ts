import 'whatwg-fetch';
jest.mock('./utils/env', () => ({
	getApiBaseUrl: () => 'http://localhost:3000',
  }));