process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe.only('Errors', () => {

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

  it('Throws HTTP 500 Internal Server Error if user function has error', async () => {

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
});