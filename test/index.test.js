'use strict';

const expect = require('chai').expect;
const apiMethods = require('..');

describe('index', () => {
  it('should be a function that creates the API model', () => {
    expect(apiMethods).to.be.a('function');
  });
});
