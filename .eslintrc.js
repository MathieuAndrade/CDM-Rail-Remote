module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  plugins: [
    "html"
  ],
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  settings: {
    'import/core-modules': [ 'electron' ]
  },
  rules: {
		'radix': 0,
		'no-plusplus': 0,
		'no-mixed-operators': 0,
		'max-len': ['error', { 'code': 190 }],
		'no-use-before-define': ['error', { 'functions': false, 'classes': true }],
		'object-shorthand': 0,
		'no-console': 0,
    'no-spaced-func': 0,
    'func-call-spacing': ["error", "never"],
    'lines-around-directive': 0,
  },
};
