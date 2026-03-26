const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  transform: {
    ['^.+\\.tsx?$']: [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true
        }
      }
    ]
  }
}

// eslint-disable-next-line import/no-default-export
export default jestConfig
