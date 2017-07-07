'use strict';

const expect = require('chai').expect;
const handler = require('../lib/handler');

describe('handler', () => {
  describe('load time', () => {
    it('should throw if one of the args is not a parameter in the handler', () => {
      const api = {
        handler: (a, b) => {},
        args: {
          a: {},
          c: {},
        },
      };
      expect(() => handler(api)).to.throw();
    });
  });

  describe('call time (args options explictly passed)', () => {
    const handle = handler({
      handler: (a, b) => a + b,
      args: {
        a: {
          parse: Number,
        },
        b: {
          parse: Number,
        },
      },
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
        args: {
          a: {
            parse: Number,
          },
          b: {
            parse: Number,
          },
        },
      };
      const result = handler(method)({a: 1, b: 2});
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
      args: {
        a: {
          optional: true,
        }
      }
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

  describe('call time (convert parameter case)', () => {
    // Handler functions define args in camel case
    const fn = (argOne, argTwo) => {
      expect(argOne).to.equal(1);
      expect(argTwo).to.equal(2);

      return argOne + argTwo;
    };

    // Method schema defines args in snake case
    const method = {
      handler: fn,
      args: {
        arg_one: {
          parse: Number,
        },
        arg_two: {
          parse: Number,
        },
      },
    };
    const result = handler(method)({argOne: 1, argTwo: 2});
    expect(result).to.equal(3);
  });

  describe('call time (custom argument name mapping)', () => {
    // Handler functions define args in snake case, and we pass a
    //  custom name adapter that makes no change and expects snake case
    const noopName = (arg) => { return arg; };
    const fn = (arg_one, arg_two) => {
      expect(arg_one).to.equal(1);
      expect(arg_two).to.equal(2);

      return arg_one + arg_two;
    };

    // Method schema defines args in snake case
    const method = {
      handler: fn,
      args: {
        arg_one: {
          parse: Number,
        },
        arg_two: {
          parse: Number,
        },
      },
    };
    const options = { argNameMapFn: noopName };
    const result = handler(method, options)({arg_one: 1, arg_two: 2});
    expect(result).to.equal(3);
  });

  describe('call time (parse arguments)', () => {
    // Handler function just ensures the input args are correct
    const fn = (argNum) => {
      return argNum;
    };

    // Handle corner cases of parsing and coercing falsy values
    const method = {
      handler: fn,
      args: {
        argNum: {
          parse: (v) => {
            if (v === 0) {
              return false;
            }
            return true;
          },
        },
      },
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
      args: {
        arg: {
          parse: Number,
          validate: (a) => {
            if (a < 0) {
              throw 'negative_number';
            }
          }
        },
      },
    };
    expect(() => handler(method)({arg: -1})).to.throw('negative_number');
  });
});
