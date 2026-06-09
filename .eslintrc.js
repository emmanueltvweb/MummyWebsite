module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // add `project: './tsconfig.json'` if you enable type-aware rules later
  },
  plugins: [
  '@typescript-eslint',
  'react',
  'react-hooks',
  'jsx-a11y',
  'import'
],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  settings: {
    react: { version: 'detect' },
    // Use the typescript resolver so import/no-unresolved understands `@/...` aliases
    'import/resolver': {
      typescript: {
        // make sure this path points to your tsconfig.json
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // keep useful rules but reduce immediate noise so you can iterate:
    'no-console': 'warn',
    'no-debugger': 'warn',

    // project style choices:
    'react/react-in-jsx-scope': 'off',

    // Relax rules that caused many blocking errors in your run:
    'react/prop-types': 'off',                // you're using TS / or mixed files
    'react/no-unescaped-entities': 'warn',    // change to 'off' if you prefer
    '@typescript-eslint/no-explicit-any': 'warn',

    // import ordering + unused imports:
    // 'unused-imports/no-unused-imports': 'warn',
    'import/order': ['warn', { 'newlines-between': 'always' }]
  }
};