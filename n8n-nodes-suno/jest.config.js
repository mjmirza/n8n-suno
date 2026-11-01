/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
	},
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.test.ts'],
	collectCoverageFrom: [
		'nodes/**/transport.ts',
		'nodes/**/utils/**/*.ts',
		'nodes/**/*.handler.ts',
		'!**/dist/**',
	],
	// Enforced by CI and publish through npm run test:coverage. Set to the measured floor, raise it as coverage grows.
	coverageThreshold: {
		global: {
			statements: 97,
			branches: 88,
			functions: 98,
			lines: 97,
		},
	},
};
