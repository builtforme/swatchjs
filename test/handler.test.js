'use strict';

const expect = require('chai').expect;
const handler = require('../lib/handler');

describe('handler', () => {
  describe('load time', () => {
    it ('should throw if args are provided and arity doesnt match', () => {
      const threeFn = (a, b, c) => {};
      const threeMethod = {
        handler: threeFn,
        args: [ 'a', 'b' ],
      };
      expect(() => handler(threeMethod)).to.throw('invalid_arg_list');

      const zeroFn = () => {};
      const zeroMethod = {
        handler: zeroFn,
        args: [ 'a' ],
      };
      expect(() => handler(zeroMethod)).to.throw('invalid_arg_list');
    });
  });

  describe('call time (args options explictly passed with names)', () => {
    const handle = handler({
      handler: (a, b) => a + b,
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
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => handle({a: 1})).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => handle({a: 1, b: 2, c: 3})).to.throw('invalid_arg_name');
    });

    it('should invoke the handler if all required arguments were passed', () => {
      const fn = (a, b) => {
        expect(a).to.equal(1);
        expect(b).to.equal(2);

        return a + b;
      };
      const method = {
        handler: fn,
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
      };
      const result = handler(method)({a: 1, b: 2});
      expect(result).to.equal(3);
    });

    it('should use method arg names when provided', () => {
      const api = {
        handler: (a, b) => {},
        args: [
          { name: 'a' },
          { name: 'c' }
        ],
      };
      expect(() => handler(api)({a: '.', b: '.'})).to.throw();
      expect(() => handler(api)({a: '.', c: '.'})).not.to.throw();
    });
  });

  describe('call time (args explictly passed as strings)', () => {
    const handle = handler({
      handler: (a, b, c) => a + b + c,
      args: [ 'x', 'y', 'z' ],
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => handle({x: '1'})).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => handle({w: '0', x: '1', y: '2', z: '3'})).to.throw('invalid_arg_name');
    });

    it('should invoke the handler if all required arguments were passed', () => {
      // Handler function is defined with local parameters `a, b, c`
      const fn = (a, b, c) => {
        expect(a).to.equal('1');
        expect(b).to.equal('2');
        expect(c).to.equal('3');

        return a + b + c;
      };
      // API is defined for external callers to use arguments `x, y, z`
      const method = {
        handler: fn,
        args: [ 'x', 'y', 'z' ],
      };
      const result = handler(method)({z: '3', y: '2', x: '1'});
      expect(result).to.equal('123');
    });

    it('should invoke the handler if all arguments are a mix of objects and strings', () => {
      // Handler function is defined with local parameters `a, b, c`
      const fn = (a, b, c) => {
        expect(a).to.equal('1');
        expect(b).to.equal('2');
        expect(c).to.equal('3');

        return a + b + c;
      };
      // API is defined for external callers to use arguments `y, x, c`
      const method = {
        handler: fn,
        args: [
          { name: 'y' },
          'x',
          { parse: String }
        ],
      };
      const result = handler(method)({c: '3', x: '2', y: '1'});
      expect(result).to.equal('123');

      expect(() => handler(method)({a: '1', b: '2', c: '3'})).to.throw('invalid_arg_name');
      expect(() => handler(method)({x: '1', y: '2', z: '3'})).to.throw('invalid_arg_name');
    });
  });

  describe('call time (args options explictly passed without names)', () => {
    const handle = handler({
      handler: (a, b) => a + b,
      args: [
        { parse: Number },
        { parse: Number },
      ],
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => handle({a: 1})).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => handle({a: 1, b: 2, c: 3})).to.throw('invalid_arg_name');
    });

    it('should invoke the handler if all required arguments were passed', () => {
      const fn = (a, b) => {
        expect(a).to.equal(1);
        expect(b).to.equal(2);

        return a + b;
      };
      const method = {
        handler: fn,
        args: [
          { parse: Number },
          { parse: Number },
        ],
      };
      const result = handler(method)({b: 2, a: 1});
      expect(result).to.equal(3);
    });
  });

  describe('call time (args options not passed)', () => {
    const handle = handler({
      handler: (a, b) => Number(a) + Number(b),
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => handle({a: 1})).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => handle({a: 1, b: 2, c: 3})).to.throw('invalid_arg_name');
    });

    it('should invoke the handler if all required arguments were passed', () => {
      const fn = (a, b) => {
        expect(a).to.equal(1);
        expect(b).to.equal(2);

        return a + b;
      };
      const method = {
        handler: fn,
      };
      const result = handler(method)({a: 1, b: 2});
      expect(result).to.equal(3);
    });
  });

  describe('call time (optional parameters)', () => {
    const handle = handler({
      handler: a => a,
      args: [
        {
          name: 'a',
          optional: true,
        },
      ]
    });

    it('should invoke the handler if optional arguments were omitted', () => {
      const result = handle({});
      expect(result).to.be.undefined;
    });

    it('should invoke the handler if optional arguments were passed', () => {
      const result = handle({a: 'hello'});
      expect(result).to.equal('hello');
    });
  });

  describe('call time (parse arguments)', () => {
    // Handler function just ensures the input args are correct
    const fn = (argNum) => {
      return argNum;
    };

    // Handle corner cases of parsing and coercing falsy values
    const method = {
      handler: fn,
      args: [
        {
          name: 'argNum',
          parse: (v) => {
            if (v === 0) {
              return false;
            }
            return true;
          },
        },
      ],
    };
    const resultZero = handler(method)({argNum: 0});
    expect(resultZero).to.equal(false);

    const resultUndefined = handler(method)({argNum: null});
    expect(resultUndefined).to.equal(true);

    const resultFalse = handler(method)({argNum: false});
    expect(resultFalse).to.equal(true);

    const resultNumber = handler(method)({argNum: 1});
    expect(resultNumber).to.equal(true);
  });

  describe('call time (validate arguments)', () => {
    // Handler function doesnt do anything special
    const fn = (arg) => {
      return arg;
    };

    // Method schema defines one arg and a validate method
    //  that will throw if the arg is a negative number
    const method = {
      handler: fn,
      args: [
        {
          parse: Number,
          validate: (a) => {
            if (a < 0) {
              throw 'negative_number';
            }
          }
        },
      ],
    };
    expect(() => handler(method)({arg: -1})).to.throw('negative_number');
  });
});
