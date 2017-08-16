const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./schemas/validator');

const validate = validator(serviceSchema);

function load(api) {
  function prepare(key) {
    const methodSchema = api[key];
    const methodHandler = handler(methodSchema);

    const metadata = methodSchema.metadata || {};

    return {
      name: key,
      match: methodHandler.match,
      handle: methodHandler.handle,
      metadata: {
        noAuth: metadata.noAuth || false,
        middleware: metadata.middleware || [],
      },
    };
  }

  return Object.keys(validate(api)).map(prepare);
}

module.exports = load;
