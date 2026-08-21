import type { Config } from 'jest'

const jestConfig: Config = {
  testEnvironment: 'jsdom',
  watchman: false,
  // ts-jest + jsdom workers grow past 1.5GB each; unbounded they swamp dev machines
  maxWorkers: '50%',
  workerIdleMemoryLimit: '1GB',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.spec.tsx', '<rootDir>/api/**/*.spec.ts'],
  transform: {
    ['^.+\\.tsx?$']: [
      'ts-jest',
      {
        tsconfig: {
          // Match the app build target (tsconfig.app.json) so native ES2020
          // features survive transpilation. Without this, ts-jest down-levels
          // the `**` operator to `Math.pow`, which throws on BigInt operands
          // (e.g. `10n ** 18n` in OverviewTab.helpers' `formatPriceMana`).
          target: 'ES2020',
          esModuleInterop: true,
          jsx: 'react-jsx'
        },
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    '\\.(webp|png|jpg|jpeg|gif|svg|mp4|webm|mov)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/src/__test-utils__/', '/src/__mocks__/', '/src/setupTests.ts'],
  globalSetup: '<rootDir>/src/__test-utils__/jestGlobalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironmentOptions: {}
}

// eslint-disable-next-line import/no-default-export
export default jestConfig
