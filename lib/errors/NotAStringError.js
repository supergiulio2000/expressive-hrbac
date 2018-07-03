'use strict';

const HRBACError = require('./HRBACError');

class NotAStringError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = NotAStringError;