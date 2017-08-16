const expect = require('chai').expect;
const load = require('../lib/loader');

function validate(model) {
  model.forEach((method) => {
    expect(method).to.be.an('object').that.has.all.keys('name', 'handle', 'metadata');
    expect(method.name).to.be.a('string');
    expect(method.handle).to.be.a('function');

    expect(method.metadata).to.be.an('object').that.has.all.keys('noAuth', 'middleware');
    expect(method.metadata.noAuth).to.be.an('boolean');
    expect(method.metadata.middleware).to.be.an('array');
  });
}

describe('model', () => {
  describe('validation', () => {
    it('should reject if API is not an object', () => {
      expect(() => load()).to.throw();
      expect(() => load(null)).to.throw();
      expect(() => load(1)).to.throw();
      expect(() => load('a')).to.throw();
      expect(() => load(true)).to.throw();
      expect(() => load(() => {})).to.throw();
    });

    it('should reject an invalid API', () => {
      expect(() => load({ foo: 'bar' })).to.throw();
    });

    it('should reject a method with no handler', () => {
      const api = {
        method: {},
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if handler is not a function', () => {
      const api = {
        noop: {
          handler: 1,
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if args is not an array', () => {
      const api = {
        noop: {
          handler: () => {},
          args: 1,
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if args list is smaller than the function definition', () => {
      const api = {
        noop: {
          handler: (a, b) => (a + b),
          args: ['a'],
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if args list is larger than the function definition', () => {
      const api = {
        noop: {
          handler: (a, b) => (a + b),
          args: ['a', 'b', 'c'],
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if metadata is not an object', () => {
      const api = {
        noop: {
          handler: (a, b) => (a + b),
          args: ['a', 'b'],
          metadata: () => {},
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if middleware is not a list of functions', () => {
      const api = {
        noop: {
          handler: (a, b) => (a + b),
          args: ['a', 'b'],
          metadata: {
            middleware: [1, () => {}],
          },
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if noAuth is not a boolean', () => {
      const api = {
        noop: {
          handler: (a, b) => (a + b),
          args: ['a', 'b'],
          metadata: {
            noAuth: 0,
          },
        },
      };
      expect(() => load(api)).to.throw();
    });
  });

  describe('results', () => {
    it('should accept an API with no endpoints', () => {
      const model = load({});
      expect(model).to.be.an('array');
      expect(model.length).to.equal(0);
    });

    it('should accept the shorthand form of method description', () => {
      const api = {
        'numbers.add': (a, b) => (a + b),
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });

    it('should accept an endpoint with only named arguments', () => {
      const add = (a, b) => (a + b);
      const api = {
        'strings.add': {
          handler: add,
          args: ['a', 'b'],
        },
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });

    it('should accept an endpoint with an unnamed argument array', () => {
      const add = (a, b) => (a + b);
      const api = {
        'numbers.add': {
          handler: add,
          args: [
            { parse: Number },
            { parse: Number },
          ],
        },
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });

    it('should produce an endpoint metadata array', () => {
      const add = (a, b) => (a + b);
      const api = {
        'numbers.add': {
          handler: add,
          args: [
            {
              name: 'a',
              parse: Number,
            },
            {
              name: 'b',
              parse: Number,
            },
          ],
        },
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });

    it('should pass in middleware array', () => {
      const add = (a, b) => (a + b);
      const middleware = [
        ctx => (ctx),
        (ctx, next) => (next + 1),
      ];
      const api = {
        'numbers.add': {
          handler: add,
          args: [
            {
              name: 'a',
              parse: Number,
            },
            {
              name: 'b',
              parse: Number,
            },
          ],
          metadata: {
            middleware,
          },
        },
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);

      expect(model[0].metadata.middleware).to.be.an('array').that.has.lengthOf(2);
      expect(model[0].metadata.middleware[0](1, 2)).to.equal(1);
      expect(model[0].metadata.middleware[1](1, 2)).to.equal(3);
    });
  });
});
