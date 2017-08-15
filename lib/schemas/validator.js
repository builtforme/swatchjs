const Joi = require('joi');

function validator(schema) {
  function validate(value) {
    const result = Joi.validate(value, schema);
    if (result.error) {
      throw result.error;
    }

    return value;
  }

  return validate;
}

module.exports = validator;
