// ESLint 9+ flat config
// We use .cjs because this project is "type": "module"
const coreDapps = require('@dcl/eslint-config/core-dapps.config')

module.exports = [
  ...coreDapps,
  {
    ignores: [
      'scripts/**',
      'vite.config.ts',
      'eslint.config.cjs',
      'prettier.config.cjs',
      'jest.config.ts',
      'src/__mocks__/**',
      'e2e/**',
    ],
  },
  {
    files: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/setupTests.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]
