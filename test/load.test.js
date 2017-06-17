'use strict';

const expect = require('chai').expect;
const load = require('../lib/load');

function validate(model) {
  model.forEach(method => {
    expect(method).to.be.an('object').that.has.all.keys('route', 'handle');
    expect(method.route).to.be.a('string');
    expect(method.handle).to.be.a('function');
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
      expect(() => load(()=>{})).to.throw();
    });

    it('should reject an invalid API', () => {
      expect(() => load({'foo':'bar'})).to.throw();
    });

    it('should reject if handler is not a function', () => {
      const api = {
        "noop": {
          handler: 1,
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if args is not an object', () => {
      const api = {
        "noop": {
          handler: () => {},
          args: 1,
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if one of the args is not a parameter in the handler', () => {
      const api = {
        "noop": {
          handler: (a, b) => {},
          args: {
            a: {},
            c: {},
          },
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject if args is ill-formed', () => {
      const api = {
        "noop": {
          handler: a => {},
          args: {
            'a': {
              foo: 'bar',
            }
          },
        },
      };
      expect(() => load(api)).to.throw();
    });

    it('should reject a method with no handler', () => {
      const api = {
        "method": {},
      };
      expect(() => load(api)).to.throw();
    });
  });

  describe('results', () => {
    it('should accept an API with no endpoints', () => {
      const model = load({});
      expect(model).to.be.an('array').that.is.empty;
    });

    it('should produce an endpoint metadata array', () => {
      const add = (a, b) => a + b;
      const api = {
        "numbers.add": {
          handler: add,
          args: {
            a: {
              parse: Number,
            },
            b: {
              parse: Number,
            },
          },
        },
      };
      const model = load(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });
  });

  describe('options', () => {
    it('should use route prefix', () => {
      const fn = () => {};
      const api = {
        "noop": {
          handler: fn,
        },
      };
      const options = {
        prefix: 'foo',
      };

      const modelWithoutOptions = load(api);
      expect(modelWithoutOptions[0].route).to.equal('/noop');

      const modelWithOptions = load(api, options);
      expect(modelWithOptions[0].route).to.equal('/foo/noop');
    });
  });
});
