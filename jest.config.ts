import type { Config } from 'jest';

export default {
  globals: {},
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [6133, 6196],
        },
      },
    ],
  },
  roots: ['src'],
  testMatch: ['**/test/test-unit/**/*.(js|ts)', '**/*.test.(js|ts)'],
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/.build', '<rootDir>/.sst', '<rootDir>/node_modules'],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    // Non logic directories
    'node_modules',
    '.package',
    '.serverless',
    '.tmp',
    '.temp',
    '.husky',
    'webpack',
    'coverage',
    'dist',
    'logs',
    'node_modules',
    'jest.setupEnvironment.js',
    'jest.config.ts',
    'scripts',
    'test/mocks',
    'system/aws/.cdk*.out',
  ],
} satisfies Config;
