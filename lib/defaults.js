'use strict';

function defaults(options) {
  return {
    prefix: (options && options.prefix) || '',
  };
}

module.exports = defaults;
