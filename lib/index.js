(function (myModule) {

  let funcs       = new Map();
  let middlewares = new Map();

  isAsync = (func) => {
    return func.constructor.name === 'AsyncFunction';
  };

  myModule.addBool = (label, func) => {

    funcs.set(label, func);
  };

  myModule.getBool = (label) => funcs.get(label);

  myModule.or = (label1, label2) => {
    
    let func1 = funcs.get(label1);
    let func2 = funcs.get(label2);

    let func = null;

    if (isAsync(func1) && isAsync(func1)) {
      func = async (req) => await func1(req) || await func2(req);
    } else if (isAsync(func1) && !isAsync(func1)) {
      func = async (req) => await func1(req) || func2(req);
    } else if (!isAsync(func1) && isAsync(func1)) {
      func = async (req) => func1(req) || await func2(req);
    } else if (!isAsync(func1) && !isAsync(func1)) {
      func = (req) => func1(req) || func2(req);
    }

    return func;
  }

  myModule.addMiddleware = (label, func) => {

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

    middlewares.set(label, middleware);
  };

  myModule.getMiddleware = (label) => middlewares.get(label);

})(module.exports);