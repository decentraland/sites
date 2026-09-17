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
    // The beehiiv newsletter embed is the only raw `<iframe>` that needs `credentialless`,
    // a real Chromium attribute eslint-plugin-react does not know about yet. It is what
    // lets a cross-origin frame load inside our COEP documents — see src/react-iframe.d.ts.
    files: ['src/components/LandingFooter/LandingFooter.tsx'],
    rules: {
      'react/no-unknown-property': ['error', { ignore: ['credentialless'] }],
    },
  },
]
