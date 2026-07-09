// commitlint.config.js — Conventional Commits enforcement
// @see https://commitlint.js.org/

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting (no code change)
        'refactor', // Refactoring (no feat/fix)
        'perf',     // Performance improvement
        'test',     // Adding or updating tests
        'build',    // Build system or deps
        'ci',       // CI configuration
        'chore',    // Other changes
        'revert',   // Revert a commit
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
