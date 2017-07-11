'use strict';

const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./schemas/validator');

const validate = validator(serviceSchema);

function load(api) {
  return Object.keys(validate(api)).map(prepare);

  function prepare(key) {
    const methodSchema = api[key];

    return {
      name: key,
      handle: handler(methodSchema),
    };
  }
}

module.exports = load;
