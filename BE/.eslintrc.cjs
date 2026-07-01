/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2023: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', 'drizzle', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2023, sourceType: 'module' },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
