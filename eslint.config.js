const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/', 'coverage/', '.nyc_output/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
      },
    },
    rules: {
      'no-debugger': 'error',
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'keyword-spacing': ['error', { before: true }],
      'array-bracket-spacing': ['error', 'never'],
      'camelcase': ['error'],
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      'comma-spacing': ['error', { before: false, after: true }],
      'no-multi-str': 'error',
      'no-use-before-define': 'error',
      'no-empty-function': 'error',
      'eqeqeq': 'error',
      'default-case': 'error',
      'no-var': 'error',
      'max-params': ['error', 4],
      'max-len': ['error', 140, {
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
      'space-before-blocks': 'error',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'semi': ['error', 'always'],
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
    },
  },
];
