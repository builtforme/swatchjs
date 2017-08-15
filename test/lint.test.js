'use strict';

const lint = require('mocha-eslint');

// Explicit test to run linter as part of test suite
const paths = [
  'index.js',
  'lib',
];

const options = {
  strict: true, // Fail test suite on any warnings or errors
};

lint(paths, options);
