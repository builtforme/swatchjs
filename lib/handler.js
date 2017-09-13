const fnArgs = require('function-arguments');
const errors = require('./errors');

function normalize(method) {
  if (typeof method === 'function') {
    return {
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
  if (methodSchema.args !== undefined) {
    if (methodSchema.args.length !== functionArgs.length) {
      throw {
        message: errors.INVALID_ARG_LIST,
        details: `Expected ${functionArgs.length} arguments but found ${methodSchema.args.length} instead.`,
      };
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
        optional: false,
      };
    }

    // If `arg` is an object, it should have metadata from the schema
    //  `arg.name` is optional, so use name from method handler
    //  All the rest of the metadata should come from the schema
    const name = arg.name || functionArgs[idx];

    // Make sure the default value passes validation
    if (arg.validate !== undefined && arg.default !== undefined) {
      try {
        arg.validate(arg.default);
      } catch (err) {
        throw {
          message: errors.INVALID_DEFAULT,
          details: `Default value "${arg.default}" for argument ${arg.name} did not pass validation.`,
        };
      }
    }

    return {
      name,
      default: arg.default,
      optional: !!arg.optional,
      parse: arg.parse,
      validate: arg.validate,
    };
  });

  // Finally cache list of the expected argument key strings/names
  const expectedArgNames = argsMetadata.map(info => info.name);

  // When invoked, we have to verify that:
  // 1. verify that all parameters passed are recognized
  // 2. verify that all required parameters were passed
  // 3. replace missing, optional params with defaults
  // 4. parse and validate any args with methods defined
  // 5. produce ordered array of values to be used with apply
  function matcher(args) {
    Object.keys(args).forEach((arg) => {
      if (!expectedArgNames.includes(arg)) {
        throw {
          message: errors.INVALID_ARG_NAME,
          details: `Extraneous argument "${arg}".`,
        };
      }
    });

    const keys = argsMetadata.map(arg => arg.name);

    const values = argsMetadata.map((arg) => {
      let passed = args[arg.name];
      if (passed === undefined) {
        if (!arg.optional) {
          throw {
            message: errors.MISSING_ARG,
            details: `Required argument "${arg.name}" missing.`,
          };
        }
        passed = arg.default;
      }

      const parsedArg = arg.parse ? arg.parse(passed) : passed;
      if (arg.validate !== undefined) {
        arg.validate(parsedArg);
      }
      return parsedArg;
    });

    const params = {};
    expectedArgNames.forEach((name, idx) => {
      params[name] = values[idx];
    });

    return {
      keys,
      params,
    };
  }

  return matcher;
}

function handler(methodSchema) {
  const normalizedSchema = normalize(methodSchema);
  const match = getMatchFn(normalizedSchema);

  function validateParams(ctx, params) {
    const result = match(params);
    ctx.swatchCtx.keys = result.keys; // Array of ordered arg names
    ctx.swatchCtx.params = result.params; // Dict of params by name
  }

  function handleMethod(ctx) {
    const args = ctx.swatchCtx.keys.map(key => (
      ctx.swatchCtx.params[key]
    ));
    return normalizedSchema.handler.apply(ctx.swatchCtx, args);
  }

  return {
    handle: handleMethod,
    validate: validateParams,
  };
}

module.exports = handler;
