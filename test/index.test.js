const expect = require('chai').expect;
const swatch = require('..');

describe('index', () => {
  it('should be a function that creates the API model', () => {
    expect(swatch).to.be.a('function');
  });
});
