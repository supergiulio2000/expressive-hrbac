(function (myModule) {

  let roles       = new Map();
  let getRoleFunc = null;
  let funcs       = new Map();

  let isAsync = (func) => {
    return func.constructor.name === 'AsyncFunction';
  };

  let getFunc = (func) => {
    return (typeof func === 'string') ? funcs.get(func) : func;
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

    roles.set(role, parents);

    let func = null;

    if (getRoleFunc) {
      if (isAsync(getRoleFunc)) {

        func = async (req) => {

          reqRole = await getRoleFunc(req);

          reqRole = getRolesArrayWithParents(reqRole);

          return reqRole.includes(role);
        }
      } else {
        func = (req) => {
          
          reqRole = getRoleFunc(req);

          reqRole = getRolesArrayWithParents(reqRole);

          if (reqRole instanceof Array) {
            return reqRole.includes(role);
          } else {
            return reqRole === role;
          }
        }
      }
    } else {

      func = (req) => {
          
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

    funcs.set(label, func);
  };

  myModule.getBool = (label) => funcs.get(label);

  myModule.or = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    if (isAsync(func1) && isAsync(func2)) {
      return async (req) => await func1(req) || await func2(req);
    } else if (isAsync(func1) && !isAsync(func2)) {
      return async (req) => await func1(req) || func2(req);
    } else if (!isAsync(func1) && isAsync(func2)) {
      return async (req) => func1(req) || await func2(req);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      return (req) => func1(req) || func2(req);
    }
  }

  myModule.and = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    if (isAsync(func1) && isAsync(func2)) {
      return async (req) => await func1(req) && await func2(req);
    } else if (isAsync(func1) && !isAsync(func2)) {
      return async (req) => await func1(req) && func2(req);
    } else if (!isAsync(func1) && isAsync(func2)) {
      return async (req) => func1(req) && await func2(req);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      return (req) => func1(req) && func2(req);
    }
  }

  myModule.not = (func) => {

    func = getFunc(func);

    if (isAsync(func)) {
      return async (req) => !await func(req);
    } else {
      return (req) => !func1(req);
    }
  }

  myModule.middleware = (func) => {

    func = getFunc(func);

    let middleware = null;

    if (isAsync(func)) {

      middleware = async (req, res, next) => {
        try {

          if(await func(req)) {
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

        if(func(req)) {
          next();
        } else {
          next('DENY');
        }
      };
    }

    return middleware;
  }

})(module.exports);