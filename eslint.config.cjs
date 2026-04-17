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
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/setupTests.ts',
    ],
  },
  // explore-site files copied verbatim — imports will be fixed in the next task
  {
    files: [
      'src/components/explore/**/*.{ts,tsx}',
      'src/pages/explore/**/*.{ts,tsx}',
      'src/features/explore-events/**/*.{ts,tsx}',
      'src/features/explore-notifications/**/*.{ts,tsx}',
      'src/hooks/useCardActions.ts',
      'src/hooks/useCreateEventForm.ts',
      'src/hooks/useRemindMe.ts',
      'src/hooks/useVisibleColumnCount.ts',
      'src/utils/signedFetch.ts',
      'src/utils/exploreDate.ts',
      'src/utils/exploreTime.ts',
      'src/utils/exploreUrl.ts',
    ],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
]


