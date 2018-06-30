'use strict';

const HRBACError = require('./HRBACError');

class LabelAlreadyInUseError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = LabelAlreadyInUseError;