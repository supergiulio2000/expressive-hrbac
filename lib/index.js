(function (myModule) {

  let funcs       = new Map();
  let middlewares = new Map();

  let isAsync = (func) => {
    return func.constructor.name === 'AsyncFunction';
  };

  let getFunc = (func) => {
    return (typeof func === 'string') ? funcs.get(func) : func;
  }

  myModule.addRole = (role) => {

    let func = (req) => {

      if (req.user.role instanceof Array) {
        return req.user.role.includes(role);
      } else {
        return req.user.role === role;
      }
    };

    funcs.set(role, func);

    middleware = (req, res, next) => {

      if(func(req)) {
        next();
      } else {
        next('Errore');
      }
    };

    middlewares.set(role, middleware);
  }

  myModule.addBoolFunc = (label, func) => {

    funcs.set(label, func);
  };

  myModule.getBool = (label) => funcs.get(label);

  myModule.or = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    let func = null;

    if (isAsync(func1) && isAsync(func2)) {
      func = async (req) => await func1(req) || await func2(req);
    } else if (isAsync(func1) && !isAsync(func2)) {
      func = async (req) => await func1(req) || func2(req);
    } else if (!isAsync(func1) && isAsync(func2)) {
      func = async (req) => func1(req) || await func2(req);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      func = (req) => func1(req) || func2(req);
    }

    return func;
  }

  myModule.and = (func1, func2) => {

    func1 = getFunc(func1);
    func2 = getFunc(func2);

    let func = null;

    if (isAsync(func1) && isAsync(func2)) {
      func = async (req) => await func1(req) && await func2(req);
    } else if (isAsync(func1) && !isAsync(func2)) {
      func = async (req) => await func1(req) && func2(req);
    } else if (!isAsync(func1) && isAsync(func2)) {
      func = async (req) => func1(req) && await func2(req);
    } else if (!isAsync(func1) && !isAsync(func2)) {
      func = (req) => func1(req) && func2(req);
    }

    return func;
  }

  myModule.generateMiddleware = (func) => {

    func = getFunc(func);

    let middleware = null;

    if (isAsync(func)) {

      middleware = async (req, res, next) => {
        try {
          console.log('Async func');

          if(await func(req)) {
            next();
          } else {
            next('Errore');
          }
        } catch (error) {
          next(error);
        }
      };
    } else {

      middleware = (req, res, next) => {
        console.log('Sync func');

        if(func(req)) {
          next();
        } else {
          next('Errore');
        }
      };
    }

    return middleware;
  }

})(module.exports);