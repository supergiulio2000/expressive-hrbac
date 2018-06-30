'use strict';

const HRBACError = require('./HRBACError');

class EmptyParameterError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = EmptyParameterError;