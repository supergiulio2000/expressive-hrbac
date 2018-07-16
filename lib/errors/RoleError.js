'use strict';

const HRBACError = require('./HRBACError');

class RoleError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = RoleError;