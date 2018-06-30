'use strict';

const HRBACError = require('./HRBACError');

class MissingFunctionError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = MissingFunctionError;