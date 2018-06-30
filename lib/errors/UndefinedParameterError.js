'use strict';

const HRBACError = require('./HRBACError');

class UndefinedParameterError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = UndefinedParameterError;