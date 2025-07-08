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
	},
	moduleNameMapper: {
	  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
  };