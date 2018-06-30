'use strict';

const HRBACError = require('./HRBACError');

class RoleAlreadyExistsError extends HRBACError {
  constructor(...args) {
    super(...args);
  }
}

module.exports = RoleAlreadyExistsError;