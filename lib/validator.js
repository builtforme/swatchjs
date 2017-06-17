'use strict';

var Joi = require('joi');

function validator(schema) {
  return validate;

  function validate(value) {
    const result = Joi.validate(value, schema);
    if (result.error) {
      throw result.error;
    }

    return value;
  }
}

module.exports = validator;
