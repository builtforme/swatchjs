'use strict';

const fnArgs = require('function-arguments');
const errors = require('./errors');

function handler(method) {
  const match = getMatchFn(method);
  return handle;

  function handle(params) {
    const args = match(params);
    return method.handler.apply(null, args);
  }
}

function getMatchFn(method) {
  const functionArgs = fnArgs(method.handler);
  const declaredArgs = (method.args && Object.keys(method.args)) || [];

  // when loaded, we need to:
  // 1. verify that all declared args exist in the function
  // 2. produce an array (ordered) of arguments, and their metadata
  declaredArgs.forEach(arg => {
    if (!functionArgs.includes(arg)) {
      throw `no argument called '${arg}' declared in handler`;
    }
  });

  const argsMetadata = functionArgs.map(arg => {
    const info = method.args[arg];

    return {
      name: arg,
      required: !info.optional,
      parse: info.parse,
    };
  });

  // when invoked, we have to verify that:
  // 1. verify that all parameters passed are recognized
  // 2. verify that all required parameters were passed
  // 3. produce an ordered array of values passed in, to be used with apply
  function matcher(args) {
    Object.keys(args).forEach(arg => {
      if (!functionArgs.includes(arg)) {
        throw errors.INVALID_ARG_NAME;
      }
    });

    const values = argsMetadata.map(arg => {
      const passed = args[arg];

      if (arg.required && passed === void 0) {
        throw errprs.MISSING_ARG;
      }
      return (arg.parse && arg.parse(passed)) || passed;
    });

    return values;
  }
}

module.exports = handler;
