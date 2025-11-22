module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // Basic rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    // Allow any types for query builder flexibility
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow non-null assertions (common in query builders)
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  overrides: [
    {
      // Rules for TypeScript files
      files: ['**/*.ts'],
      rules: {
        // Already handled in main rules
      },
    },
    {
      // Less strict rules for test files
      files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
