'use strict';

const expect = require('chai').expect;
const apiMethods = require('..');

describe('index', () => {
  it('should contain a load function', () => {
    expect(apiMethods.load).to.be.a('function');
  });
});
