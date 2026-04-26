import js from '@eslint/js';
import globals from 'globals';

const NO_INFRASTRUCTURE_IMPORTS = {
  paths: [
    { name: 'axios', message: 'Inject axios via createHttpClient — only bin/ wires concrete drivers.' },
    { name: 'mysql2', message: 'Inject mysql2 via loadMysql2/createMysqlClient — only bin/ wires concrete drivers.' },
    { name: 'mysql2/promise', message: 'Inject mysql2 via loadMysql2/createMysqlClient — only bin/ wires concrete drivers.' },
    { name: 'os', message: 'Use os only in src/utils/paths.js or src/utils/bootstrap/. Everywhere else, paths.userDirectory() honors HOME/USERPROFILE.' },
    { name: 'update-notifier', message: 'update-notifier is loaded by scheduleUpdateNotifier in src/utils/bootstrap/. Bin imports it dynamically.' },
  ],
};

const NO_BARE_NEW_DATE = {
  selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
  message: 'Use clock.now() instead of new Date() so time can be controlled in tests. Only src/utils/clock.js may construct a bare Date.',
};

export default [
  {
    ignores: ['node_modules/', 'coverage/', '.nyc_output/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
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
    },
  },
  // Boundary: utils are pure helpers — they signal failures via thrown
  // errors with cause, never via console.log. Enforced after phase D-2,
  // F-2, H-1 each had to remove a console.log smuggled into a util.
  {
    files: ['src/utils/**/*.js'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // Boundary: only the composition root and bootstrap helpers may import
  // concrete infrastructure (axios, mysql2, os, update-notifier). Every
  // other file must receive its world via deps injection. This is the
  // Sandi/POOD invariant phases A–H established by inspection.
  {
    files: ['src/**/*.js'],
    ignores: [
      'src/utils/bootstrap/**',
      'src/utils/paths.js',
      'src/scripts/post-install.js',
    ],
    rules: {
      'no-restricted-imports': ['error', NO_INFRASTRUCTURE_IMPORTS],
    },
  },
  // Boundary: time enters the system through clock.now(). Only clock.js
  // may build a bare Date(). Tests are unrestricted because they often
  // need to construct deterministic timestamps.
  {
    files: ['src/**/*.js', 'bin/**/*.js'],
    ignores: ['src/utils/clock.js'],
    rules: {
      'no-restricted-syntax': ['error', NO_BARE_NEW_DATE],
    },
  },
];
