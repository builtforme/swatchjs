'use strict';

const defaults = require('./defaults');
const handler = require('./handler');
const serviceSchema = require('./schemas/service');
const validator = require('./validator');
const validate = validator(serviceSchema);

function model(api, options) {
  api = validate(api);
  options = defaults(options);

  return Object.keys(api).map(prepare);

  function prepare(key) {
    const method = api[key];

    return {
      route: `${options.prefix}/${key}`,
      handle: handler(method),
    };
  }
}

module.exports = model;
