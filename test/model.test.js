'use strict';

const expect = require('chai').expect;
const apiMethods = require('..');

function validate(model) {
  model.forEach(method => {
    expect(method).to.be.an('object').that.has.all.keys('route', 'handle');
    expect(method.route).to.be.a('string');
    expect(method.handle).to.be.a('function');
  });
}

describe('model', () => {
  describe('types', () => {
    it('should reject if API is not an object', () => {
      expect(() => apiMethods.model()).to.throw();
      expect(() => apiMethods.model(null)).to.throw();
      expect(() => apiMethods.model(1)).to.throw();
      expect(() => apiMethods.model('a')).to.throw();
      expect(() => apiMethods.model(true)).to.throw();
      expect(() => apiMethods.model(()=>{})).to.throw();
    });

    it('should reject an invalid API', () => {
      expect(() => apiMethods.model({'foo':'bar'})).to.throw();
    });

    it('should accept an API with no endpoints', () => {
      const model = apiMethods.model({});
      expect(model).to.be.an('array').that.is.empty;
    });

    it('should reject a method with no handler', () => {
      const api = {
        "method": {},
      };
      expect(() => apiMethods.model(api)).to.throw();
    });

    it('should reject if handler is not a function', () => {
      const api = {
        "noop": {
          handler: 1,
        },
      };
      expect(() => apiMethods.model(api)).to.throw();
    });

    it('should produce an endpoint metadata array', () => {
      const add = (a, b) => a + b;
      const api = {
        "numbers.add": {
          handler: add,
          args: {
            a: {
              type: Number,
              required: true,
            },
            b: {
              type: Number,
              required: true,
            },
          },
        },
      };
      const model = apiMethods.model(api);
      expect(model).to.be.an('array').that.has.lengthOf(1);
      validate(model);
    });
  });

  describe('options', () => {
    it('use route prefix', () => {
      const fn = () => {};
      const api = {
        "noop": {
          handler: fn,
        },
      };
      const options = {
        prefix: 'foo',
      };

      const modelWithoutOptions = apiMethods.model(api);
      expect(modelWithoutOptions[0].route).to.equal('/noop');

      const modelWithOptions = apiMethods.model(api, options);
      expect(modelWithOptions[0].route).to.equal('/foo/noop');
    });
  });
});
