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
    ],
  },
  {
    files: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/setupTests.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    // Cast (LiveKit streaming) absorbed from decentraland/cast2. The source
    // dapp uses PascalCase React contexts, PascalCase MUI icon imports, and
    // PascalCase keys in `childComponents` slot maps that differ from sites'
    // default naming convention. Disable only the naming rule for the cast
    // surface; everything else (security, react-hooks, import order) stays on.
    files: [
      'src/components/cast/**/*.ts',
      'src/components/cast/**/*.tsx',
      'src/features/cast2/**/*.ts',
      'src/features/cast2/**/*.tsx',
      'src/pages/cast/**/*.ts',
      'src/pages/cast/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]
