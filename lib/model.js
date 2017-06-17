'use strict';

const defaults = require('./defaults');
const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./validator');
const validate = validator(serviceSchema);

function model(api, options) {
  options = defaults(options);
  return Object.keys(validate(api)).map(prepare);

  function prepare(key) {
    const method = api[key];

    return {
      route: options.route(key),
      handle: handler(method),
    };
  }
}

module.exports = model;
