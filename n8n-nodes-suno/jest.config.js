/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.test.ts'],
	collectCoverageFrom: [
		'nodes/**/transport.ts',
		'nodes/**/utils/**/*.ts',
		'nodes/**/*.handler.ts',
		'!**/dist/**',
	],
	coverageThreshold: {
		global: {
			statements: 99,
			branches: 97,
			functions: 100,
			lines: 100,
		},
	},
};
