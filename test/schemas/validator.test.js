'use strict';

const expect = require('chai').expect;

const serviceSchema = require('../../lib/schemas/service');
const schemaValidator = require('../../lib/schemas/validator');

const validate = schemaValidator(serviceSchema);


describe('validator', () => {
  const validateArg1 = (arg) => {};
  const validateArg2 = (arg) => {};

  describe('schema', () => {
    it('should allow a valid schema', () => {
      const api = {
        fn: {
          handler: (arg_1, arg_2) => { arg_1 + arg_2 },
          args: {
            arg_1: {
              parse: Number,
              validate: validateArg1,
              optional: false,
            },
            arg_2: {
              parse: Number,
              validate: validateArg2,
              optional: true,
            },
          },
        },
      };
      const validatedApi = validate(api);

      expect(validatedApi).to.deep.equal(api);
    });

    it('should throw on invalid method names', () => {
      const invalidName1 = {
        'invalid-name': {
          handler: () => { },
        },
      };
      expect(() => validate(invalidName1)).to.throw();

      const invalidName2 = {
        '1stFunction': {
          handler: () => { },
        },
      };
      expect(() => validate(invalidName2)).to.throw();

      const invalidName3 = {
        '_some_function_': {
          handler: () => { },
        },
      };
      expect(() => validate(invalidName3)).to.throw();
    });

    it('should throw on invalid function schemas', () => {
      const missingHandler = {
        fn: {
          args: {
            arg_1: {
              parse: Number,
              validate: validateArg1,
            },
          },
        },
      };
      expect(() => validate(missingHandler)).to.throw();

      const unexpectedVars = {
        fn: {
          handler: (arg_1) => { arg_1 },
          args: {
            arg_1: {
              parse: Number,
              validate: validateArg1,
            },
          },
          somethingElse: {},
        },
      };
      expect(() => validate(unexpectedVars)).to.throw();
    });

    it('should throw on invalid handler type', () => {
      const nonFunctionHandler = {
        fn: {
          handler: 100,
        },
      };
      expect(() => validate(nonFunctionHandler)).to.throw();
    });

    it('should throw on invalid arg definition', () => {
      const extraArgParam = {
        fn: {
          handler: (arg_1) => { arg_1 },
          args: {
            arg_1: {
              parse: Number,
              validate: validateArg1,
              somethingElse: true,
            },
          },
        },
      };
      expect(() => validate(extraArgParam)).to.throw();

      const invalidParseFn = {
        fn: {
          handler: (arg_1) => { arg_1 },
          args: {
            arg_1: {
              parse: 'number',
              validate: validateArg1,
              optional: true,
            },
          },
        },
      };
      expect(() => validate(invalidParseFn)).to.throw();

      const invalidValidateFn = {
        fn: {
          handler: (arg_1) => { arg_1 },
          args: {
            arg_1: {
              parse: Number,
              validate: false,
              optional: false,
            },
          },
        },
      };
      expect(() => validate(invalidValidateFn)).to.throw();

      const invalidOptionalParam = {
        fn: {
          handler: (arg_1) => { arg_1 },
          args: {
            arg_1: {
              parse: Number,
              validate: validateArg1,
              optional: String,
            },
          },
        },
      };
      expect(() => validate(invalidOptionalParam)).to.throw();
    });
  });
});
