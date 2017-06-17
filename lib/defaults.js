'use strict';

function defaults(options) {
  function route(name) {
    const prefix = (options && options.prefix && `/${options.prefix}/`) || '/';
    return `${prefix}${name}`;
  }

  return {
    route,
  };
}

module.exports = defaults;
