module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	testMatch: [
	  '**/?(*.)+(test).[jt]s?(x)'
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	roots: ['<rootDir>/src'],
	transform: {
	  '^.+\\.(ts|tsx)$': 'ts-jest',
	  '^.+\\.svg$': 'jest-transform-stub',
	},
	moduleNameMapper: {
	  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@components/(.*)$': '<rootDir>/src/components/$1',
	  '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
	},
  };