'use strict';

class HRBAC {

  constructor() {
    this.roles       = new Map();
    this.getRoleFunc = null;
    this.funcs       = new Map();
  }

  isAsync(func) {
    return func.constructor.name === 'AsyncFunction';
  };

  getFunc(func){
    
    if (func === null) {
      throw new Error('Function is null');
    }

    if (typeof func === 'string') {

      if (func.length === 0) {
        throw new Error('Function label is empty');
      }

      if (!this.funcs.has(func)) {
        throw new Error('Function has not been added: ' + func);
      }

      return this.funcs.get(func);
    } else {
      return func
    }
  }

  removeDuplicates(array) {
    return [...new Set(array)];
  }

  /* takes a role or an array of roles and returns 
     an array with the starting role plus all the
     parents of all starting roles/roles*/
  getRolesArrayWithParents(role) {

    let result = [];

    if (role instanceof Array) {
      for (let currRole of role) {
        result = result.concat(this.getRolesArrayWithParents(currRole));
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
          result = result.concat(this.getRolesArrayWithParents(parent));
        }
      } else {
        result.push(parents);

        result = result.concat(this.getRolesArrayWithParents(parents));
      }
    }

    return this.removeDuplicates(result);
  }

  addGetRoleFunc(func) {
    this.getRoleFunc = func;
  }

  addRole(role, parents = null) {

    if (role === null) {
      throw new Error('Role label is null');
    }

    if (role.length === 0) {
      throw new Error('Role label is empty');
    }

    if (this.roles.has(role)) {
      throw new Error('Role has already been used as function label: ' + role);
    }

    if (this.funcs.has(role)) {
      throw new Error('Role already exists: ' + role);
    }

    if (parents) {
      if (parents instanceof Array) {
        for (let parent of parents) {
          if (!this.roles.has(parent)) {
            throw new Error('Can not inherit from non-existant role: ' + parent);
          }
        }
      } else {
        if (!this.roles.has(parents)) {
          throw new Error('Can not inherit from non-existant role: ' + parents);
        }
      }
    }

    this.roles.set(role, parents);

    let func = null;

    if (this.getRoleFunc) {
      if (this.isAsync(this.getRoleFunc)) {

        func = async (req, res) => {

          let reqRole = await this.getRoleFunc(req, res);

          reqRole = this.getRolesArrayWithParents(reqRole);

          return reqRole.includes(role);
        }
      } else {
        func = (req, res) => {
          
          let reqRole = this.getRoleFunc(req, res);

          reqRole = this.getRolesArrayWithParents(reqRole);
          
          if (reqRole instanceof Array) {
            return reqRole.includes(role);
          } else {
            return reqRole === role;
          }
        }
      }
    } else {

      func = (req, res) => {
          
        let reqRole = this.getRolesArrayWithParents(req.user.role);

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
      throw new Error('Function label is null');
    }

    if (label.length === 0) {
      throw new Error('Function label is empty');
    }

    if (this.roles.has(label)) {
      throw new Error('Label has lready been used as role: ' + label);
    }

    if (this.funcs.has(label)) {
      throw new Error('Label already exists: ' + label);
    }

    this.funcs.set(label, func);
  };

  or(func1, func2) {

    func1 = this.getFunc(func1);
    func2 = this.getFunc(func2);

    if (this.isAsync(func1) && this.isAsync(func2)) {
      return async (req, res) => await func1(req, res) || await func2(req, res);
    } else if (this.isAsync(func1) && !this.isAsync(func2)) {
      return async (req, res) => await func1(req, res) || func2(req, res);
    } else if (!this.isAsync(func1) && this.isAsync(func2)) {
      return async (req, res) => func1(req, res) || await func2(req, res);
    } else if (!this.isAsync(func1) && !this.isAsync(func2)) {
      return (req, res) => func1(req, res) || func2(req, res);
    }
  }

  and(func1, func2) {

    func1 = this.getFunc(func1);
    func2 = this.getFunc(func2);

    if (this.isAsync(func1) && this.isAsync(func2)) {
      return async (req, res) => await func1(req, res) && await func2(req, res);
    } else if (this.isAsync(func1) && !this.isAsync(func2)) {
      return async (req, res) => await func1(req, res) && func2(req, res);
    } else if (!this.isAsync(func1) && this.isAsync(func2)) {
      return async (req, res) => func1(req, res) && await func2(req, res);
    } else if (!this.isAsync(func1) && !this.isAsync(func2)) {
      return (req, res) => func1(req, res) && func2(req, res);
    }
  }

  not(func) {

    func = this.getFunc(func);

    if (this.isAsync(func)) {
      return async (req, res) => !await func(req, res);
    } else {
      return (req, res) => !func1(req, res);
    }
  }

  middleware(func) {

    func = this.getFunc(func);

    let middleware = null;

    if (this.isAsync(func)) {

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
