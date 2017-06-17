'use strict';

const fnArgs = require('function-arguments');
const defaults = require('./defaults');
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
      args: fnArgs(method.handler),
      route: `${options.prefix}/${key}`,
      method,
    };
  }
}

module.exports = model;
