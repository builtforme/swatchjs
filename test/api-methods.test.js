'use strict';

const expect = require('chai').expect;
const apiMethods = require('..');

describe('API', () => {
  describe('Methods', () => {
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
      expect(model).to.deep.equal([
        {
          args: [ 'a', 'b' ],
          route: `/numbers.add`,
          method: api['numbers.add'],
        },
      ]);
    });
  });
});
