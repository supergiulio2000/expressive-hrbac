process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const NullParameterError            = require('../../lib/errors/NullParameterError');
const UndefinedParameterError       = require('../../lib/errors/UndefinedParameterError');
const NotAFunctionError             = require('../../lib/errors/NotAFunctionError');
const ParameterNumberMismatchError  = require('../../lib/errors/ParameterNumberMismatchError');

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe('Errors', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Throws HTTP 401 Unauthorised if access is denied', async () => {

    req = {
      user: {
        role: 'admino',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(401);
      expect(err.message).to.eql('Unauthorized');
    });
  });

  describe('Error with function passed to addUnauthorizedErrorFunc() ', () => {

    it('Undef first argument throws error', async () => {

      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac)).to.throw(UndefinedParameterError);
    });

    it('Null first argument throws error', async () => {

      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, null)).to.throw(NullParameterError);
    });

    it('First argument must be a function', async () => {

      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, 5)).to.throw(NotAFunctionError);
    });

    it('Function takes 3 or 4 arguments', async () => {

      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, () => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, (req) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, (req, res) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addUnauthorizedErrorFunc.bind(hrbac, (req, res, next, ciccio, rocco) => 5)).to.throw(ParameterNumberMismatchError);
    });
  });

  it('Throws HTTP custom error as defined in the custom sync function if access is denied', async () => {

    req = {
      user: {
        role: 'admino',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addUnauthorizedErrorFunc((req, res, next) => {
      let err = new Error('Forbidden');
      err.status = 403;
      next(err);
    })

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(403);
      expect(err.message).to.eql('Forbidden');
    });
  });

  it('Throws HTTP custom error as defined in the custom async function if access is denied', async () => {

    req = {
      user: {
        role: 'admino',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addUnauthorizedErrorFunc(async (req, res, next) => {
      let err = new Error();
      err.message = 'Forbidden';
      err.status = 403;
      next(err);
    })

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(403);
      expect(err.message).to.eql('Forbidden');
    });
  });

  it('Throws HTTP custom error using user object as defined in the custom function if access is denied', async () => {

    req = {
      user: {
        role: 'admino',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addUnauthorizedErrorFunc((req, res, next, userObj) => {
      let err = new Error();
      err.message = 'Not Found';
      err.status = userObj.customHttpCode;
      next(err);
    })

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func', { customHttpCode: 404});

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(404);
      expect(err.message).to.eql('Not Found');
    });
  });


  it('Throws HTTP custom error using user object as defined in the custom async function if access is denied', async () => {

    req = {
      user: {
        role: 'admino',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addUnauthorizedErrorFunc(async (req, res, next, userObj) => {
      let err = new Error();
      err.message = 'Not Found';
      err.status = userObj.customHttpCode;
      next(err);
    })

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func', { customHttpCode: 404});

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(404);
      expect(err.message).to.eql('Not Found');
    });
  });

  it('Throws HTTP 500 Internal Server Error if user sync function has error', async () => {

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addBoolFunc('func', (req, res) => req.userr.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(500);
    });
  });

  it('Throws HTTP 500 Internal Server Error if user async function has error', async () => {

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addBoolFunc('func', async (req, res) => req.userr.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(500);
    });
  });

  describe('Error with function passed to addCustomFunctionErrorFunc() ', () => {

    it('Undef first argument throws error', async () => {

      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac)).to.throw(UndefinedParameterError);
    });

    it('Null first argument throws error', async () => {

      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, null)).to.throw(NullParameterError);
    });

    it('First argument must be a function', async () => {

      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, 5)).to.throw(NotAFunctionError);
    });

    it('Function takes 3 arguments', async () => {

      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, () => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, (err) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, (err, req) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, (err, req, res) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addCustomFunctionErrorFunc.bind(hrbac, (err, req, res, next, ciccio) => 5)).to.throw(ParameterNumberMismatchError);
    });
  });

  it('Throws HTTP custom error in user sync function if user sync function has error', async () => {

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addCustomFunctionErrorFunc((err, req, res, next) => {
      err.message = 'This is error';
      err.status = 600;
      next(err);
    });

    hrbac.addBoolFunc('func', (req, res) => req.userr.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(600);
      expect(err.message).to.eql('This is error');
    });
  });

  it('Throws HTTP custom error in user sync function if user async function has error', async () => {

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addCustomFunctionErrorFunc(async (err, req, res, next) => {
      err.message = 'This is error';
      err.status = 600;
      next(err);
    });

    hrbac.addBoolFunc('func', (req, res) => req.userr.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.status).to.eql(600);
      expect(err.message).to.eql('This is error');
    });
  });
});
