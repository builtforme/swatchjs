'use strict';

var Joi = require('joi');

const handler =
  Joi
    .func();

const argName =
  Joi
    .string()
    .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, 'argument name');

const argObject =
  Joi
    .object()
    .keys({
      name: argName,
      parse: Joi.func(),
      validate: Joi.func(),
      optional: Joi.boolean(),
    });

const args =
  Joi
    .array()
    .items(argName, argObject);

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
    .pattern(/^[a-z][a-zA-Z0-9.]*$/, method);

module.exports = api;
