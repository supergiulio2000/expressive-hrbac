'use strict';

const HRBACError = require('./HRBACError');

class NullParameterError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = NullParameterError;