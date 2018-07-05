'use strict';

const HRBACError = require('./HRBACError');

class ParameterNumberMismatchError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = ParameterNumberMismatchError;