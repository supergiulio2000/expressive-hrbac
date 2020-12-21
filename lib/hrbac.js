'use strict';

const NullParameterError            = require('./errors/NullParameterError');
const EmptyParameterError           = require('./errors/EmptyParameterError');
const MissingFunctionError          = require('./errors/MissingFunctionError');
const LabelAlreadyInUseError        = require('./errors/LabelAlreadyInUseError');
const RoleAlreadyExistsError        = require('./errors/RoleAlreadyExistsError');
const MissingRoleError              = require('./errors/MissingRoleError');
const NotAFunctionError             = require('./errors/NotAFunctionError');
const NotAStringError               = require('./errors/NotAStringError');
const UndefinedParameterError       = require('./errors/UndefinedParameterError');
const ParameterNumberMismatchError  = require('./errors/ParameterNumberMismatchError');
const RoleError                     = require('./errors/RoleError');

class HRBAC {

  constructor() {
    this.roles                 = new Map();
    this.getRoleFunc           = (req, res) => req.user.role;
    this.unauthorizedErrorFunc = (req, res, next) => {
      let err = new Error('Unauthorized');
      err.status = 401;
      next(err);
    };
    this.customFunctionErrorFunc = (err, req, res, next) => {
      err.message = 'Internal Server Error (' + err.message + ')';
      err.status = 500;
      next(err);
    };
    this.funcs                 = new Map();
  }

  static getInstance(label = null) {

    if (!HRBAC._instance) {
      HRBAC._instance = new Map()
    }

    if (label === null) {
      label = '';
    } else {
      HRBAC._mustBeValidString(label, 'label');
    }

    if (!HRBAC._instance.get(label)) {
      HRBAC._instance.set(label, new HRBAC());
    }

    return HRBAC._instance.get(label);
  }

  _isAsync(func) {
    return func.constructor.name === 'AsyncFunction';
  };

  _mustBeValidFunction(func, name, argsNumber, maxArgsNumber) {

    if (func === undefined) {
      throw new UndefinedParameterError('Function is undefined: ' + name);
    }

    if (func === null) {
      throw new NullParameterError('Function is null: ' + name);
    }

    let constructor = func.constructor ? func.constructor.name : '';

    if ((constructor === 'AsyncFunction') || (constructor === 'Function')) {
      // is function
    } else {

      throw new NotAFunctionError('Not a function: ' + name + ' [value:' + func + ']');
    }

    if (maxArgsNumber) {
      // If maxArgsNumber is provided the argsNumber parameter is to be interpreted as a minimum number of args
      if (func.length < argsNumber || func.length > maxArgsNumber) {

        throw new ParameterNumberMismatchError('Function expects between ' + argsNumber + ' and ' + maxArgsNumber + ' arguments: ' + name);
      }
    } else {
      if (func.length != argsNumber) {

        throw new ParameterNumberMismatchError('Function expects ' + argsNumber + ' arguments: ' + name);
      }
    }
  }

  static _mustBeValidString(string, name) {

    if (string === undefined) {
      throw new UndefinedParameterError('Param is undefined: ' + name);
    }

    if (string === null) {
      throw new NullParameterError('Param is null: ' + name);
    }

    if (typeof(string) != 'string') {
      throw new NotAStringError('Paramater is not a string: ' + name)
    }

    if (string.length === 0) {
      throw new EmptyParameterError('String is empty: ' + name);
    }
  }

  static _mustBeValidRole(role) {

    if (role instanceof Array) {
      for (let currRole of role) {
        HRBAC._mustBeValidString(currRole, 'role');
      }
    } else {
      HRBAC._mustBeValidString(role, 'role');
    }
  }

  _getFunc(func){

    if (func === undefined) {
      throw new UndefinedParameterError('Function is undefined');
    }

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

      this._mustBeValidFunction(func, 'func', 2);

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

/**
 * Adds a function to get the role from the request object
 * @param {sync/async function} func - Function to be called
 * @throws {UndefinedParameterError} - When 'func' is undefined
 * @throws {NullParameterError} - When 'func' is null
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 3 arguments
 * @returns {HRBAC} current HRBAC instance.
 */
  addGetRoleFunc(func) {

    this._mustBeValidFunction(func, 'func', 2);

    this.getRoleFunc = func;

    return this;
  }

/**
 * Adds a function to get the role from the request object
 * @param {sync/async function} func - Function to be called
 * @throws {UndefinedParameterError} - When 'func' is undefined
 * @throws {NullParameterError} - When 'func' is null
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 3 arguments
 * @returns {HRBAC} current HRBAC instance.
 */
  addUnauthorizedErrorFunc(func) {

    this._mustBeValidFunction(func, 'func', 3, 4);

    this.unauthorizedErrorFunc = func;

    return this;
  }

  /**
 * Adds a function to get the role from the request object
 * @param {sync/async function} func - Function to be called
 * @throws {UndefinedParameterError} - When 'func' is undefined
 * @throws {NullParameterError} - When 'func' is null
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 4 arguments
 * @returns {HRBAC} current HRBAC instance.
 */
  addCustomFunctionErrorFunc(func) {

    this._mustBeValidFunction(func, 'func', 4);

    this.customFunctionErrorFunc = func;

    return this;
  }

/**
 * Adds a role to the HRBAC instance
 * @param {string} role - The role string to be added
 * @param {string|string[]} parents - The parent string of array of parent strings for this role
 * @throws {UndefinedParameterError} - When 'role' is undefined
 * @throws {NullParameterError} - When 'role' is null
 * @throws {EmptyParameterError} - When 'role' is empty string
 * @throws {NotAStringError} - When 'role' is not a string
 * @throws {RoleAlreadyExistsError} - If 'role' already exists
 * @throws {LabelAlreadyInUseError} - If 'role' has already been used as label
 * @throws {MissingRoleError} - If any parent role has not been added yet
 * @returns {HRBAC} current HRBAC instance.
 */
  addRole(role, parents = null) {

    HRBAC._mustBeValidString(role, 'role');

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

    if (this._isAsync(this.getRoleFunc)) {

      func = async (req, res) => {

        let reqRole = undefined;

        try {
          reqRole = await this.getRoleFunc(req, res);

          HRBAC._mustBeValidRole(reqRole);
        } catch (err) {
          throw new RoleError('Role is invalid: ' + err.message);
        }

        reqRole = this._getRolesArrayWithParents(reqRole);

        return reqRole.includes(role);
      }
    } else {
      func = (req, res) => {

        let reqRole = undefined;

        try {
          reqRole = this.getRoleFunc(req, res);

          HRBAC._mustBeValidRole(reqRole);
        } catch (err) {
          throw new RoleError('Role is invalid: ' + err.message);
        }

        reqRole = this._getRolesArrayWithParents(reqRole);
        
        return reqRole.includes(role);
      }
    }

    this.funcs.set(role, func);

    return this;
  }

/**
 * Adds a role to the HRBAC instance
 * @param {string} label - The role string to be added
 * @param {sync/async function} func
 * @throws {UndefinedParameterError} - When 'label' or 'func' are undefined
 * @throws {NullParameterError} - When 'label' or 'func' is null
 * @throws {EmptyParameterError} - When 'role' is empty string
 * @throws {NotAStringError} - When 'role' is not a string
 * @throws {LabelAlreadyInUseError} - If 'role' has already been used as label
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 2 arguments
 * @returns {HRBAC} current HRBAC instance.
 */
  addBoolFunc(label, func) {

    HRBAC._mustBeValidString(label, 'label');

    this._mustBeValidFunction(func, 'func', 2);

    if (this.funcs.has(label)) {
      throw new LabelAlreadyInUseError('Label already exists: ' + label);
    }

    if (this.roles.has(label)) {
      throw new LabelAlreadyInUseError('Label already used as role: ' + label);
    }

    this.funcs.set(label, func);

    return this;
  };

/**
 * Combines two function with boolean OR
 * @param {string|sync/async function} func1 - Function label or actual function
 * @param {string|sync/async function} func2 - Function label or actual function
 * @throws {UndefinedParameterError} - When 'func1' or 'func2' is undefined
 * @throws {NullParameterError} - When 'func1' or 'func2' is null
 * @throws {MissingFunctionError} - When 'func1' or 'func2' is a string with no associated function
 * @throws {NotAFunctionError} - When 'func1' or 'func2' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func1' or 'func2' does not accept 2 arguments
 * @returns {sync/async function} combined function in or.
 */
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

/**
 * Adds a role to the HRBAC instance
 * @param {string|sync/async function} func1 - Function label or actual function
 * @param {string|sync/async function} func2 - Function label or actual function
 * @throws {UndefinedParameterError} - When 'func1' or 'func2' is undefined
 * @throws {NullParameterError} - When 'func1' or 'func2' is null
 * @throws {MissingFunctionError} - When 'func1' or 'func2' is a string with no associated function
 * @throws {NotAFunctionError} - When 'func1' or 'func2' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func1' or 'func2' does not accept 2 arguments
 * @returns {sync/async function} combined function in and.
 */
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

/**
 * Adds a role to the HRBAC instance
 * @param {string|sync/async function} func - Function label or actual function
 * @throws {UndefinedParameterError} - When 'func' is undefined
 * @throws {NullParameterError} - When 'func' is null
 * @throws {MissingFunctionError} - When 'func' is a string with no associated function
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 2 arguments
 * @returns {sync/async function} negated function.
 */
  not(func) {

    func = this._getFunc(func);

    if (this._isAsync(func)) {
      return async (req, res) => !await func(req, res);
    } else {
      return (req, res) => !func(req, res);
    }
  }

/**
 * Generate middleware from function
 * @param {string|sync/async function} func - Function label or actual function
 * @throws {UndefinedParameterError} - When 'func' is undefined
 * @throws {NullParameterError} - When 'func' is null
 * @throws {MissingFunctionError} - When 'func' is a string with no associated function
 * @throws {NotAFunctionError} - When 'func' is not a function
 * @throws {ParameterNumberMismatchError} - If 'func' does not accept 2 arguments
 * @returns {sync/async function} Expressjs middleware.
 */
  middleware(func, userObj) {

    func = this._getFunc(func);

    return async (req, res, next) => {

      let bool = false;
      
      try {
        if (this._isAsync(func)) {
          bool = await func(req, res);
        } else {
          bool = func(req, res);
        }
      } catch (err) {
        if (err instanceof RoleError) {
          if (this._isAsync(this.unauthorizedErrorFunc)) {
            return await this.unauthorizedErrorFunc(req, res, next, userObj);
          } else {
            return this.unauthorizedErrorFunc(req, res, next, userObj);
          }
        } else {
          if (this._isAsync(this.customFunctionErrorFunc)) {
            return await this.customFunctionErrorFunc(err,req, res, next);
          } else {
            return this.customFunctionErrorFunc(err, req, res, next);
          }
        }
      }

      if(bool) {
        next();
      } else {
        if (this._isAsync(this.unauthorizedErrorFunc)) {
          return await this.unauthorizedErrorFunc(req, res, next, userObj);
        } else {
          return this.unauthorizedErrorFunc(req, res, next, userObj);
        }
      }
    };
  }

/**
 * Returns TRUE if descendant if a children of ancestor
 * @descendant {string} role - The role string to be added
 * @param {string} role - The role string to be added
 * @throws {UndefinedParameterError} - When 'descendant' or 'ancestor' is undefined
 * @throws {NullParameterError} - When 'descendant' or 'ancestor' is null
 * @throws {EmptyParameterError} - When 'descendant' or 'ancestor' is empty string
 * @throws {NotAStringError} - When 'descendant' or 'ancestor' is not a string
 * @throws {MissingRoleError} - If 'descendant' or 'ancestor' has not been added yet
 * @returns {boolean}.
 */
  isDescendant(descendant, ancestor) {
    if (descendant === undefined) {
      throw new UndefinedParameterError('Descendant role can\'t be undefined');
    }

    if (ancestor === undefined) {
      throw new UndefinedParameterError('Parent role can\'t be undefined');
    }

    if (descendant === null) {
      throw new NullParameterError('Descendant role can\'t be null');
    }

    if (ancestor === null) {
      throw new NullParameterError('Parent role can\'t be null');
    }

    if (descendant.length === 0) {
      throw new EmptyParameterError('Descendant is empty');
    }

    if (ancestor.length === 0) {
      throw new EmptyParameterError('Parent is empty');
    }

    if (typeof(descendant) != 'string') {
      throw new NotAStringError('Paramater is not a string: descendant')
    }

    if (typeof(ancestor) != 'string') {
      throw new NotAStringError('Paramater is not a string: ancestor')
    }

    if (!this.roles.has(descendant)) {
      throw new MissingRoleError('Descendant role must have been added');
    }

    if (!this.roles.has(ancestor)) {
      throw new MissingRoleError('Parent role must have been added');
    }

    if (descendant === ancestor) {
      // For coherence, a role, is not a descendat of itself
      return false;
    }

    return this._getRolesArrayWithParents(descendant).includes(ancestor);
  }
}

module.exports = HRBAC;
