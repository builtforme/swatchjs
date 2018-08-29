const { expect } = require('chai');
const handler = require('../lib/handler');

const mockLogger = {
  info: () => {},
};

function execHandler(handle, args) {
  const mockCtx = {
    swatchCtx: {
      logger: mockLogger,
      testVal: 100,
    },
  };
  handle.validate(mockCtx, args);
  return handle.handle(mockCtx);
}

describe('handler', () => {
  describe('load time', () => {
    it('should throw if args are provided and arity doesnt match', () => {
      const threeFn = (a, b, c) => (a + b + c);
      const threeMethod = {
        handler: threeFn,
        args: ['a', 'b'],
      };
      expect(() => handler(threeMethod)).to.throw('invalid_arg_list');

      const zeroFn = () => {};
      const zeroMethod = {
        handler: zeroFn,
        args: ['a'],
      };
      expect(() => handler(zeroMethod)).to.throw('invalid_arg_list');
    });

    describe('defaults', () => {
      it('should throw if arg.default and arg.validate are specified and the default does not validate', () => {
        const oneFn = a => (a);
        const oneMethod = {
          handler: oneFn,
          args: [{
            name: 'a',
            parse: Number,
            validate: (param) => { if (param === 0) throw new Error('validator puked on purpose'); },
            default: 0,
          }],
        };
        expect(() => handler(oneMethod)).to.throw('invalid_default');
      });

      it('should not throw if the default does validate', () => {
        const oneFn = a => (a);
        const oneMethod = {
          handler: oneFn,
          args: [{
            name: 'a',
            parse: Number,
            validate: (param) => { if (param !== 0) throw new Error('validator puked on purpose'); },
            default: 0,
          }],
        };
        expect(() => handler(oneMethod)).not.to.throw('invalid_default');
      });

      it('should not throw if arg.default is not specified', () => {
        const oneFn = a => (a);
        const oneMethod = {
          handler: oneFn,
          args: [{
            name: 'a',
            parse: Number,
            validate: (param) => { if (param === 0) throw new Error('validator puked on purpose'); },
          }],
        };
        expect(() => handler(oneMethod)).not.to.throw('invalid_default');
      });

      it('should not throw if arg.validate is not specified', () => {
        const oneFn = a => (a);
        const oneMethod = {
          handler: oneFn,
          args: [{
            name: 'a',
            parse: Number,
            default: 0,
          }],
        };
        expect(() => handler(oneMethod)).not.to.throw('invalid_default');
      });
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
      expect(() => execHandler(handle, { a: 1 })).to.throw('missing_arg');
    });

    it('should throw if a required parameter was undefined', () => {
      expect(() => execHandler(handle, { a: 1, b: undefined })).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => execHandler(handle, { a: 1, b: 2, c: 3 })).to.throw('invalid_arg_name');
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
      const result = execHandler(handler(method), { a: 1, b: 2 });
      expect(result).to.equal(3);
    });

    it('should use method arg names when provided', () => {
      const api = {
        handler: (a, b) => (a + b),
        args: [
          { name: 'a' },
          { name: 'c' },
        ],
      };
      expect(() => execHandler(handler(api), { a: '.', b: '.' })).to.throw();
      expect(() => execHandler(handler(api), { a: '.', c: '.' })).not.to.throw();
    });
  });

  describe('call time (args explictly passed as strings)', () => {
    const handle = handler({
      handler: (a, b, c) => a + b + c,
      args: ['x', 'y', 'z'],
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => execHandler(handle, { x: '1' })).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => execHandler(handle, {
        w: '0',
        x: '1',
        y: '2',
        z: '3',
      })).to.throw('invalid_arg_name');
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
        args: ['x', 'y', 'z'],
      };
      const result = execHandler(handler(method), { z: '3', y: '2', x: '1' });
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
          { parse: String },
        ],
      };
      const result = execHandler(handler(method), { c: '3', x: '2', y: '1' });
      expect(result).to.equal('123');

      expect(() => execHandler(handler(method), { a: '1', b: '2', c: '3' })).to.throw('invalid_arg_name');
      expect(() => execHandler(handler(method), { x: '1', y: '2', z: '3' })).to.throw('invalid_arg_name');
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
      expect(() => execHandler(handle, { a: 1 })).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => execHandler(handle, { a: 1, b: 2, c: 3 })).to.throw('invalid_arg_name');
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
      const result = execHandler(handler(method), { b: 2, a: 1 });
      expect(result).to.equal(3);
    });
  });

  describe('call time (args options not passed)', () => {
    const handle = handler({
      handler: (a, b) => Number(a) + Number(b),
    });

    it('should throw if all required parameters were not passed', () => {
      expect(() => execHandler(handle, { a: 1 })).to.throw('missing_arg');
    });

    it('should throw if a parameter passed was not expected', () => {
      expect(() => execHandler(handle, { a: 1, b: 2, c: 3 })).to.throw('invalid_arg_name');
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
      const result = execHandler(handler(method), { a: 1, b: 2 });
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
      ],
    });

    it('should invoke the handler if optional arguments were omitted', () => {
      const result = execHandler(handle, {});
      expect(result).to.equal(undefined);
    });

    it('should invoke the handler if optional arguments were passed', () => {
      const result = execHandler(handle, { a: 'hello' });
      expect(result).to.equal('hello');
    });
  });

  describe('call time (parse arguments)', () => {
    // Handler function just ensures the input args are correct
    const fn = argNum => (argNum);

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

    // Framework should explicitly throw on missing or undefined values
    const handle = handler(method);
    expect(() => execHandler(handle, {})).to.throw('missing_arg');
    expect(() => execHandler(handle, { argNum: undefined })).to.throw('missing_arg');

    // Otherwise it should accept the values and run the parser
    const resultZero = execHandler(handle, { argNum: 0 });
    expect(resultZero).to.equal(false);

    const resultUndefined = execHandler(handle, { argNum: null });
    expect(resultUndefined).to.equal(true);

    const resultFalse = execHandler(handle, { argNum: false });
    expect(resultFalse).to.equal(true);

    const resultNumber = execHandler(handle, { argNum: 1 });
    expect(resultNumber).to.equal(true);
  });

  describe('call time (validate arguments)', () => {
    // Handler function doesnt do anything special
    const fn = (arg) => {
      throw new Error(arg);
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
              throw new Error('negative_number');
            }
          },
        },
      ],
    };
    expect(() => execHandler(handler(method), { arg: -1 })).to.throw('negative_number');
  });

  describe('validate params', () => {
    it('should provide access to validated params', () => {
      const fn = (a, b, c) => ({ a, b, c });
      const method = {
        handler: fn,
        args: [
          {
            name: 'a',
            parse: Number,
          },
          {
            name: 'b',
            parse: Boolean,
          },
          {
            name: 'c',
            parse: String,
          },
        ],
      };
      const handle = handler(method);

      const mockCtx = {
        swatchCtx: {},
      };
      handle.validate(mockCtx, { a: '100', b: true, c: 'Success' });

      expect(mockCtx.swatchCtx.keys).to.deep.equal(['a', 'b', 'c']);
      expect(mockCtx.swatchCtx.params.a).to.equal(100);
      expect(mockCtx.swatchCtx.params.b).to.equal(true);
      expect(mockCtx.swatchCtx.params.c).to.equal('Success');
    });
  });

  describe('context', () => {
    it('should pass the swatchCtx as this param in final handler', () => {
      function fn(a, b) {
        return a + b + this.testVal;
      }
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
      const handle = handler(method);
      expect(execHandler(handle, { a: '25', b: '50' })).to.equal(175);
    });
  });

  describe('default values', () => {
    it('should not use default values for required arguments', () => {
      const fn = a => (a);
      const method = {
        handler: fn,
        args: [
          {
            name: 'a',
            optional: false,
            parse: Number,
            default: 1,
          },
        ],
      };
      const handle = handler(method);
      expect(execHandler(handle, { a: 2 })).to.equal(2);
      expect(() => execHandler(handle, {})).to.throw('missing_arg');
    });

    it('should use default values for optional argument when undefined', () => {
      const fn = (a, b, c, d) => ({
        a,
        b,
        c,
        d,
      });
      const method = {
        handler: fn,
        args: [
          {
            name: 'a',
            optional: true,
            parse: Number,
            default: 0,
          },
          {
            name: 'b',
            optional: true,
            parse: Boolean,
            default: false,
          },
          {
            name: 'c',
            optional: true,
            default: [],
          },
          {
            name: 'd',
            optional: true,
            parse: String,
            default: '',
          },
        ],
      };
      const handle = handler(method);

      function checkResult(result, a, b, c, d) {
        expect(result.a).to.equal(a);
        expect(result.b).to.equal(b);
        expect(result.d).to.equal(d);

        expect(result.c.length).to.equal(c.length);
        result.c.forEach((val, idx) => {
          expect(val).to.equal(c[idx]);
        });
      }

      const r1 = execHandler(handle, {});
      checkResult(r1, 0, false, [], '');

      const r2 = execHandler(handle, { a: '100', b: true });
      checkResult(r2, 100, true, [], '');

      const r3 = execHandler(handle, { b: false, c: [0] });
      checkResult(r3, 0, false, [0], '');

      const r4 = execHandler(handle, { c: [], d: 'false' });
      checkResult(r4, 0, false, [], 'false');
    });
  });
});
