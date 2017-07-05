'use strict';

const toCamel = require('to-camel-case');
const fnArgs = require('function-arguments');

const errors = require('./errors');


function handler(methodSchema, options) {
  // Allow user to pass in a custom function to map arg names
  //   in the schema to arg names in the handler functions
  //  Default behavior is to map from snake case to camel case
  const handlerOpts = options || {};
  const argNameMapFn = handlerOpts.argNameMapFn || toCamel;

  const normalizedSchema = normalize(methodSchema);
  const match = getMatchFn(normalizedSchema, argNameMapFn);

  return handleMethod;

  function handleMethod(params) {
    const args = match(params);
    return normalizedSchema.handler.apply(null, args);
  }
}

function normalize(method) {
  if (typeof method === 'function') {
    method = {
      handler: method,
    };
  }
  return method;
}

function getMatchFn(methodSchema, argNameMapFn) {
  const functionArgs = fnArgs(methodSchema.handler);
  const schemaArgs = (methodSchema.args && Object.keys(methodSchema.args)) || [];

  // When loaded, we need to:
  // 1. verify that all declared args exist in the function
  const normalizedSchemaArgs = schemaArgs.reduce( (m, arg) => {
    const normalizedArg = argNameMapFn(arg);

    // Ensure the variables declared in the handling function match schema
    if (!functionArgs.includes(normalizedArg)) {
      throw `no argument called '${arg}' declared in handler`;
    }

    m[normalizedArg] = methodSchema.args[arg];
    return m;
  }, {});

  // 2. produce an array (ordered) of arguments, and their metadata
  const argsMetadata = functionArgs.map(arg => {
    const info = normalizedSchemaArgs[arg] || {};

    return {
      name: arg,
      required: !info.optional,
      parse: info.parse,
      validate: info.validate,
    };
  });

  return matcher;

  // When invoked, we have to verify that:
  // 1. verify that all parameters passed are recognized
  // 2. verify that all required parameters were passed
  // 3. parse and validate any args with methods defined
  // 4. produce an ordered array of values to be used with apply
  function matcher(args) {
    Object.keys(args).forEach(arg => {
      if (!functionArgs.includes(arg)) {
        throw errors.INVALID_ARG_NAME;
      }
    });

    const values = argsMetadata.map(arg => {
      const passed = args[arg.name];
      if (arg.required && passed === void 0) {
        throw errors.MISSING_ARG;
      }

      const parsedArg = (arg.parse && arg.parse(passed)) || passed;
      arg.validate && arg.validate(parsedArg);
      return parsedArg;
    });

    return values;
  }
}

module.exports = handler;
