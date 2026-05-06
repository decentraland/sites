import type { Config } from 'jest'

const jestConfig: Config = {
  testEnvironment: 'jsdom',
  watchman: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.spec.tsx', '<rootDir>/api/**/*.spec.ts'],
  transform: {
    ['^.+\\.tsx?$']: [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          jsx: 'react-jsx'
        },
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    '\\.(webp|png|jpg|jpeg|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironmentOptions: {}
}

// eslint-disable-next-line import/no-default-export
export default jestConfig
