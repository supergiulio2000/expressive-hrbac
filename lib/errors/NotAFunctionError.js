'use strict';

const HRBACError = require('./HRBACError');

class NotAFunctionError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = NotAFunctionError;