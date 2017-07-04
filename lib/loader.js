'use strict';

const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./schemas/validator');

const validate = validator(serviceSchema);

function load(api, options) {
  return Object.keys(validate(api)).map(prepare);

  function prepare(key) {
    const method = api[key];

    return {
      name: key,
      handle: handler(method),
    };
  }
}

module.exports = load;
