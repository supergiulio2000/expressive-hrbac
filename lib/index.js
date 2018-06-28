(function (myModule) {

  let roles       = new Map();
  let getRoleFunc = null;
  let funcs       = new Map();

  let isAsync = (func) => {
    return func.constructor.name === 'AsyncFunction';
  };

  let getFunc = (func) => {
    
    if (func === null) {
      throw new Error('Function is null');
    }

    if (typeof func === 'string') {

      if (func.length === 0) {
        throw new Error('Function label is empty');
      }

      if (!funcs.has(func)) {
        throw new Error('Function has not been added: ' + func);
      }

      return funcs.get(func);
    } else {
      return func
    }
  };

  let removeDuplicates = array => [...new Set(array)];

  /* takes a role or an array of roles and returns 
     an array with the starting role plus all the
     parents of all starting roles/roles*/
  let getRolesArrayWithParents = (role) => {

    let parents = roles.get(role);

    let result = [role];

    if (parents) {

      if (parents instanceof Array) {
        // add parents array to result

        result = result.concat(parents);

        for (let parent of parents) {
          result = result.concat(getRolesArrayWithParents(parent));
        }
      } else {
        result.push(parents);

        result = result.concat(getRolesArrayWithParents(parents));
      }
    }

    return removeDuplicates(result);
  };

  myModule.addGetRoleFunc = (func) => {
    getRoleFunc = func;
  };

  myModule.addRole = (role, parents = null) => {

    if (role === null) {
      throw new Error('Role label is null');
    }

    if (role.length === 0) {
      throw new Error('Role label is empty');
    }

    if (roles.has(role)) {
      throw new Error('Role has lready been used as function label: ' + role);
    }

    if (funcs.has(role)) {
      throw new Error('Role already exists: ' + role);
    }

    if (parents) {
      if (parents instanceof Array) {
        for (let parent of parents) {
          if (!roles.has(parent)) {
            throw new Error('Can not inherit from non-existant role: ' + parent);
          }
        }
      }
    }
    roles.set(role, parents);

    let func = null;

    if (getRoleFunc) {
      if (isAsync(getRoleFunc)) {

        func = async (req, res) => {

          reqRole = await getRoleFunc(req, res);

          reqRole = getRolesArrayWithParents(reqRole);

          return reqRole.includes(role);
        }
      } else {
        func = (req, res) => {
          
          reqRole = getRoleFunc(req, res);

          reqRole = getRolesArrayWithParents(reqRole);

          if (reqRole instanceof Array) {
            return reqRole.includes(role);
          } else {
            return reqRole === role;
          }
        }
      }
    } else {

      func = (req, res) => {
          
        reqRole = req.user.role;

        if (reqRole instanceof Array) {
          return reqRole.includes(role);
        } else {
          return reqRole === role;
        }
      }
    }

    funcs.set(role, func);
  }

  myModule.addBoolFunc = (label, func) => {

    if (label === null) {
      throw new Error('Function label is null');
    }

    if (label.length === 0) {
      throw new Error('Function label is empty');
    }

    if (roles.has(label)) {
      throw new Error('Label has lready been used as role: ' + label);
    }

    if (funcs.has(label)) {
      throw new Error('Label already exists: ' + label);
    }

    funcs.set(label, func);
  };

  myModule.or = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    if (isAsync(func1) && isAsync(func2)) {
      return async (req, res) => await func1(req, res) || await func2(req, res);
    } else if (isAsync(func1) && !isAsync(func2)) {
      return async (req, res) => await func1(req, res) || func2(req, res);
    } else if (!isAsync(func1) && isAsync(func2)) {
      return async (req, res) => func1(req, res) || await func2(req, res);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      return (req, res) => func1(req, res) || func2(req, res);
    }
  }

  myModule.and = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    if (isAsync(func1) && isAsync(func2)) {
      return async (req, res) => await func1(req, res) && await func2(req, res);
    } else if (isAsync(func1) && !isAsync(func2)) {
      return async (req, res) => await func1(req, res) && func2(req, res);
    } else if (!isAsync(func1) && isAsync(func2)) {
      return async (req, res) => func1(req, res) && await func2(req, res);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      return (req, res) => func1(req, res) && func2(req, res);
    }
  }

  myModule.not = (func) => {

    func = getFunc(func);

    if (isAsync(func)) {
      return async (req, res) => !await func(req, res);
    } else {
      return (req, res) => !func1(req, res);
    }
  }

  myModule.middleware = (func) => {

    func = getFunc(func);

    let middleware = null;

    if (isAsync(func)) {

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

})(module.exports);