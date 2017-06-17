'use strict';

const fnArgs = require('function-arguments');

function handler(method) {
  const declaredArgs = fnArgs(method.handler);
  return handler;

  function handle(params) {
    const passedArgs = getArgs(params);
    const orderedArgs = declaredArgs.map(arg => passedArgs[arg]);
    return method.handler.apply(null, orderedArgs);
  }

  function getArgs(args) {
    return Object.keys(method.args).reduce(extract, {});

    function extract(params, arg) {
      const passed = args[arg];
      const expected = method.args[arg];

      if (expected.required && passed === void 0) {
        throw `required parameter ${arg} missing`;
      }
      params[arg] = (expected.type && expected.type(passed)) || passed;
    }
  }
}

module.exports = handler;
