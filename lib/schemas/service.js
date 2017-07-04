'use strict';

var Joi = require('joi');

const handler =
  Joi
    .func();

const arg =
  Joi
    .object()
    .keys({
      parse: Joi.func(),
      validate: Joi.func(),
      optional: Joi.boolean(),
    });

const args =
  Joi
    .object()
    .pattern(/[a-zA-Z_$][a-zA-Z0-9_$]*/, arg);

const method = [
  Joi
    .object()
    .keys({
      handler: handler,
      args: args,
    })
    .requiredKeys('handler'),
  Joi.func(),
];

const api =
  Joi
    .object()
    .pattern(/[a-z][a-zA-Z0-9.]*/, method);

module.exports = api;
