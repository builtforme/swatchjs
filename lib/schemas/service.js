const Joi = require('joi');

const handler = Joi
  .func();

const argName = Joi
  .string()
  .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, 'argument name');

const argObject = Joi
  .object()
  .keys({
    name: argName,
    type: Joi.string(),
    parse: Joi.func(),
    validate: Joi.func(),
    optional: Joi.boolean(),
    description: Joi.string(),
    default: Joi.any(),
  });

const args = Joi
  .array()
  .items(argName, argObject);

const middleware = Joi
  .array()
  .items(Joi.func());

const noAuth = Joi
  .boolean();

const metadata = Joi
  .object()
  .keys({
    noAuth,
    middleware,
    description: Joi.string(),
  });

const method = [
  Joi
    .object()
    .keys({
      handler,
      args,
      metadata,
    })
    .requiredKeys('handler'),
  Joi.func(),
];

const api = Joi
  .object()
  .pattern(/^[a-z][a-zA-Z0-9.]*$/, method);

module.exports = api;
