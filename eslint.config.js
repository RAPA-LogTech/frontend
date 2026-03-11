import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'dist/',
      'build/',
      'pnpm-lock.yaml',
      '*.d.ts',
      '.eslintcache'
    ]
    },
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
          React: 'readonly',
          JSX: 'readonly'
        }
      },
      plugins: {
        '@typescript-eslint': tsPlugin
      },
      rules: {}
  }
];
