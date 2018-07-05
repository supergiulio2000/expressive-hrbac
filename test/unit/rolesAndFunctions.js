process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe('Role and Complex function combination', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('Basic OR with role and lamda functions', async () => {

    hrbac.addRole('admin');
    hrbac.addBoolFunc('is user', (req, res) => req.user.role === 'user');
    hrbac.addBoolFunc('is PUT', (req, res) => req.method === 'PUT');

    hrbac.addBoolFunc('func', hrbac.or('admin', hrbac.and('is user', hrbac.not('is PUT'))));

    middleware = hrbac.middleware('func');

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'GET',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });

    req = {
      user: {
        role: 'user',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'GET',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });

    req = {
      user: {
        role: 'user',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
    });
  });
});