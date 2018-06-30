'use strict';

const HRBACError = require('./HRBACError');

class MissingRoleError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = MissingRoleError;