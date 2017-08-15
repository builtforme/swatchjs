const expect = require('chai').expect;

const serviceSchema = require('../../lib/schemas/service');
const schemaValidator = require('../../lib/schemas/validator');

const validate = schemaValidator(serviceSchema);


describe('validator', () => {
  const validateArg1 = () => {};
  const validateArg2 = () => {};

  describe('schema', () => {
    it('should allow a valid schema', () => {
      const api = {
        fn: {
          handler: (arg1, arg2) => (arg1 + arg2),
          args: [
            {
              name: 'arg_1',
              parse: Number,
              validate: validateArg1,
              optional: false,
              default: 3,
            },
            {
              name: 'arg_2',
              parse: Number,
              validate: validateArg2,
              optional: true,
              default: 12,
            },
          ],
          middleware: [
            ctx => (ctx),
            () => {},
            () => (true),
          ],
          noAuth: true,
        },
      };
      const validatedApi = validate(api);

      expect(validatedApi).to.deep.equal(api);
    });

    it('should allow a valid schema', () => {
      const api = {
        fn: {
          handler: (a, b) => (a + b),
          args: ['a', 'b'],
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
        _some_function_: {
          handler: () => { },
        },
      };
      expect(() => validate(invalidName3)).to.throw();
    });

    it('should throw on invalid function schemas', () => {
      const missingHandler = {
        fn: {
          args: [
            {
              parse: Number,
              validate: validateArg1,
            },
          ],
        },
      };
      expect(() => validate(missingHandler)).to.throw();

      const unexpectedVars = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              name: 'arg_1',
              parse: Number,
              validate: validateArg1,
            },
          ],
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

    it('should throw on invalid noAuth type', () => {
      const nonBoolAuthParam = {
        fn: {
          handler: 100,
          noAuth: 10000,
        },
      };
      expect(() => validate(nonBoolAuthParam)).to.throw();

      const functionAuthParam = {
        fn: {
          handler: 100,
          noAuth: () => (true),
        },
      };
      expect(() => validate(functionAuthParam)).to.throw();
    });

    it('should throw on invalid arg definition', () => {
      const extraArgParam = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              name: 'arg_1',
              parse: Number,
              validate: validateArg1,
              somethingElse: true,
              default: 100,
            },
          ],
        },
      };
      expect(() => validate(extraArgParam)).to.throw();

      const invalidArgName = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              name: '_name-invalid_',
              parse: Number,
            },
          ],
        },
      };
      expect(() => validate(invalidArgName)).to.throw();

      const invalidArgParam = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              name: '_name-invalid_',
              parse: Number,
            },
            true,
          ],
        },
      };
      expect(() => validate(invalidArgParam)).to.throw();

      const invalidParseFn = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              parse: 'number',
              validate: validateArg1,
              optional: true,
            },
          ],
        },
      };
      expect(() => validate(invalidParseFn)).to.throw();

      const invalidValidateFn = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              parse: Number,
              validate: false,
              optional: false,
            },
          ],
        },
      };
      expect(() => validate(invalidValidateFn)).to.throw();

      const invalidOptionalParam = {
        fn: {
          handler: arg1 => (arg1),
          args: [
            {
              name: 'arg_1',
              parse: Number,
              validate: validateArg1,
              optional: String,
              default: 'default',
            },
          ],
        },
      };
      expect(() => validate(invalidOptionalParam)).to.throw();
    });

    it('should throw on invalid middleware definition', () => {
      const numberMiddlewareHandler = {
        fn: {
          handler: arg1 => (arg1),
          middleware: 100,
        },
      };
      expect(() => validate(numberMiddlewareHandler)).to.throw();

      const functionMiddlewareHandler = {
        fn: {
          handler: arg1 => (arg1),
          middleware: () => {},
        },
      };
      expect(() => validate(functionMiddlewareHandler)).to.throw();

      const numArrayMiddlewareHandler = {
        fn: {
          handler: arg1 => (arg1),
          middleware: [1, 2, 3, 4, 5],
        },
      };
      expect(() => validate(numArrayMiddlewareHandler)).to.throw();

      const mixedArrayMiddlewareHandler = {
        fn: {
          handler: arg1 => (arg1),
          middleware: [1, true, () => {}, () => {}],
        },
      };
      expect(() => validate(mixedArrayMiddlewareHandler)).to.throw();
    });
  });
});
