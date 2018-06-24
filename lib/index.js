(function (myModule) {

  let middleware = {};

  myModule.getMiddleware = (roles) => {

    return async (req, res, next) => {
      try {
        if (roles.some(elem => req.user.roles.includes(elem))) {
          next();
        } else {
          next('error');
        }
      } catch (error) {
        next('error');
      }
    };
  };

  myModule.getMiddleware2 = (key) => {

    middleware = {};

    // return async (req, res, next) => {
    //   try {
    //     if (roles.some(elem => req.user.roles.includes(elem))) {
    //       next();
    //     } else {
    //       next('error');
    //     }
    //   } catch (error) {
    //     next('error');
    //   }
    // };
  };
  myModule.getMiddleware3 = (func) => {

    return async (req, res, next) => {
      try {

        if(await func(req)) {
          next();
        } else {
          next('Errore');
        }
      } catch (error) {
        next(error);
      }
    };
  };

  myModule.generate = () => {
    console.log(middleware);
  }

  // myModule.roleIn = (roles) => {
  //   return roles.some(elem => req.user.roles.includes(elem));
  // }
  
  myModule.roleIn = (req, roles) => roles.some(elem => req.user.roles.includes(elem));

  myModule.if = async (req, func) => await func(req);

})(module.exports);