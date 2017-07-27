'use strict';

const fnArgs = require('function-arguments');

const errors = require('./errors');


function handler(methodSchema) {
  const normalizedSchema = normalize(methodSchema);
  const match = getMatchFn(normalizedSchema);

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

function getMatchFn(methodSchema) {
  // Get string names of arguments defined in the handler function
  const functionArgs = fnArgs(methodSchema.handler);

  // Check whether arguments were also defined in the method schema
  //  If so, first validate that schema and function have same arity
  if (methodSchema.args !== void 0) {
    if (methodSchema.args.length !== functionArgs.length) {
      throw errors.INVALID_ARG_LIST;
    }
  }

  // Use the args from the method schema if defined or else from function
  const schemaArgs = methodSchema.args || functionArgs;

  // Now create an array (ordered) of arguments and their metadata
  const argsMetadata = schemaArgs.map((arg, idx) => {
    if (typeof arg === 'string') {
      // If `arg` is a string, we use that for the argument
      //  `name` and assign default values to all the metadata
      return {
        name: arg,
        required: true,
      };
    } else {
      // If `arg` is an object, it should have metadata from the schema
      //  `arg.name` is optional, so use name from method handler
      //  All the rest of the metadata should come from the schema
      const name = arg.name || functionArgs[idx];
      return {
        name,
        default: arg.default,
        required: !arg.optional,
        parse: arg.parse,
        validate: arg.validate,
      };
    }
  });

  // Finally cache list of the expected argument key strings/names
  const expectedArgNames = argsMetadata.map(info => info.name);

  return matcher;

  // When invoked, we have to verify that:
  // 1. verify that all parameters passed are recognized
  // 2. verify that all required parameters were passed
  // 3. replace missing, optional params with defaults
  // 4. parse and validate any args with methods defined
  // 5. produce ordered array of values to be used with apply
  function matcher(args) {
    Object.keys(args).forEach(arg => {
      if (!expectedArgNames.includes(arg)) {
        throw errors.INVALID_ARG_NAME;
      }
    });

    const values = argsMetadata.map(arg => {
      let passed = args[arg.name];
      if (passed === void 0) {
        if (arg.required) {
          throw errors.MISSING_ARG;
        }
        passed = arg.default;
      }

      const parsedArg = arg.parse ? arg.parse(passed) : passed;
      arg.validate && arg.validate(parsedArg);
      return parsedArg;
    });

    return values;
  }
}

module.exports = handler;
