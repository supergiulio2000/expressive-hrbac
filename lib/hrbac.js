'use strict';

const NullParameterError     = require('./errors/NullParameterError');
const EmptyParameterError    = require('./errors/EmptyParameterError');
const MissingFunctionError   = require('./errors/MissingFunctionError');
const LabelAlreadyInUseError = require('./errors/LabelAlreadyInUseError');
const RoleAlreadyExistsError = require('./errors/RoleAlreadyExistsError');
const MissingRoleError       = require('./errors/MissingRoleError');

class HRBAC {

  constructor() {
    this.roles       = new Map();
    this.getRoleFunc = null;
    this.funcs       = new Map();
  }

  _isAsync(func) {
    return func.constructor.name === 'AsyncFunction';
  };

  _getFunc(func){
    
    if (func === null) {
      throw new NullParameterError('Function is null');
    }

    if (typeof func === 'string') {

      if (func.length === 0) {
        throw new EmptyParameterError('Function label is empty');
      }

      if (!this.funcs.has(func)) {
        throw new MissingFunctionError('Function has not been added: ' + func);
      }

      return this.funcs.get(func);
    } else {
      return func
    }
  }

  _removeDuplicates(array) {
    return [...new Set(array)];
  }

  /* takes a role or an array of roles and returns 
     an array with the starting role plus all the
     parents of all starting roles/roles*/
  _getRolesArrayWithParents(role) {

    let result = [];

    if (role instanceof Array) {
      for (let currRole of role) {
        result = result.concat(this._getRolesArrayWithParents(currRole));
      }
    } else {
      result.push(role);
    }

    let parents = this.roles.get(role);

    if (parents) {

      if (parents instanceof Array) {
        // add parents array to result

        result = result.concat(parents);

        for (let parent of parents) {
          result = result.concat(this._getRolesArrayWithParents(parent));
        }
      } else {
        result.push(parents);

        result = result.concat(this._getRolesArrayWithParents(parents));
      }
    }

    return this._removeDuplicates(result);
  }

  addGetRoleFunc(func) {
    this.getRoleFunc = func;
  }

  addRole(role, parents = null) {

    if (role === null) {
      throw new NullParameterError('Role label is null');
    }

    if (role.length === 0) {
      throw new EmptyParameterError('Role label is empty');
    }

    if (this.roles.has(role)) {
      throw new RoleAlreadyExistsError('Role already exists: ' + role);
    }

    if (this.funcs.has(role)) {
      throw new LabelAlreadyInUseError('Role has already been used as function label: ' + role);
    }

    if (parents) {
      if (parents instanceof Array) {
        for (let parent of parents) {
          if (!this.roles.has(parent)) {
            throw new MissingRoleError('Can not inherit from non-existant role: ' + parent);
          }
        }
      } else {
        if (!this.roles.has(parents)) {
          throw new MissingRoleError('Can not inherit from non-existant role: ' + parents);
        }
      }
    }

    this.roles.set(role, parents);

    let func = null;

    if (this.getRoleFunc) {
      if (this._isAsync(this.getRoleFunc)) {

        func = async (req, res) => {

          let reqRole = await this.getRoleFunc(req, res);

          reqRole = this._getRolesArrayWithParents(reqRole);

          return reqRole.includes(role);
        }
      } else {
        func = (req, res) => {
          
          let reqRole = this.getRoleFunc(req, res);

          reqRole = this._getRolesArrayWithParents(reqRole);
          
          if (reqRole instanceof Array) {
            return reqRole.includes(role);
          } else {
            return reqRole === role;
          }
        }
      }
    } else {

      func = (req, res) => {
          
        let reqRole = this._getRolesArrayWithParents(req.user.role);

        if (reqRole instanceof Array) {
          return reqRole.includes(role);
        } else {
          return reqRole === role;
        }
      }
    }

    this.funcs.set(role, func);
  }

  addBoolFunc(label, func) {

    if (label === null) {
      throw new NullParameterError('Function label is null');
    }

    if (label.length === 0) {
      throw new EmptyParameterError('Function label is empty');
    }

    if (this.roles.has(label)) {
      throw new LabelAlreadyInUseError('Label has lready been used as role: ' + label);
    }

    if (this.funcs.has(label)) {
      throw new LabelAlreadyInUseError('Label already exists: ' + label);
    }

    this.funcs.set(label, func);
  };

  or(func1, func2) {

    func1 = this._getFunc(func1);
    func2 = this._getFunc(func2);

    if (this._isAsync(func1) && this._isAsync(func2)) {
      return async (req, res) => await func1(req, res) || await func2(req, res);
    } else if (this._isAsync(func1) && !this._isAsync(func2)) {
      return async (req, res) => await func1(req, res) || func2(req, res);
    } else if (!this._isAsync(func1) && this._isAsync(func2)) {
      return async (req, res) => func1(req, res) || await func2(req, res);
    } else if (!this._isAsync(func1) && !this._isAsync(func2)) {
      return (req, res) => func1(req, res) || func2(req, res);
    }
  }

  and(func1, func2) {

    func1 = this._getFunc(func1);
    func2 = this._getFunc(func2);

    if (this._isAsync(func1) && this._isAsync(func2)) {
      return async (req, res) => await func1(req, res) && await func2(req, res);
    } else if (this._isAsync(func1) && !this._isAsync(func2)) {
      return async (req, res) => await func1(req, res) && func2(req, res);
    } else if (!this._isAsync(func1) && this._isAsync(func2)) {
      return async (req, res) => func1(req, res) && await func2(req, res);
    } else if (!this._isAsync(func1) && !this._isAsync(func2)) {
      return (req, res) => func1(req, res) && func2(req, res);
    }
  }

  not(func) {

    func = this._getFunc(func);

    if (this._isAsync(func)) {
      return async (req, res) => !await func(req, res);
    } else {
      return (req, res) => !func1(req, res);
    }
  }

  middleware(func) {

    func = this._getFunc(func);

    let middleware = null;

    if (this._isAsync(func)) {

      middleware = async (req, res, next) => {
        try {

          if(await func(req, res)) {
            next();
          } else {
            next('DENY');
          }
        } catch (error) {
          next(error);
        }
      };
    } else {

      middleware = (req, res, next) => {

        if(func(req, res)) {
          next();
        } else {
          next('DENY');
        }
      };
    }

    return middleware;
  }
}

module.exports = HRBAC;
