const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./schemas/validator');

const validate = validator(serviceSchema);

function load(api) {
  function prepare(key) {
    const methodSchema = api[key];

    return {
      name: key,
      handle: handler(methodSchema),
      noAuth: methodSchema.noAuth || false,
      middleware: methodSchema.middleware || [],
    };
  }

  return Object.keys(validate(api)).map(prepare);
}

module.exports = load;
