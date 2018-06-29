process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;
const httpMocks = require('node-mocks-http');

let hrbac = require('../../lib/index');
let middleware = null;

request = {};
response = {};

describe('Role admin without parent', () => {

  before(function() {

    hrbac.addRole('admin');

    hrbac.addBoolFunc('test_func1', (req, res) => console.log('Test'));

    middleware = hrbac.middleware('admin');
  });

  describe('should GRANT to admin', () => {
    it('GRANT to admin', async () => {

      req = {
        user: {
          role: 'admin',
        },
        route: {
          path: '/admin/delete'
        },
        method: 'PUT',
      };

      await middleware(req, null, (err = null) => {
        expect(err).to.eql(null);
      });
    });

    it('GRANT to admin role in array', async () => {

      req = {
        user: {
          role: ['admin'],
        },
        route: {
          path: '/admin/delete'
        },
        method: 'PUT',
      };

      await middleware(req, null, (err = null) => {
        expect(err).to.eql(null);
      });
    });

    it('GRANT to admin role in array with other roles', async () => {

      req = {
        user: {
          role: ['user1', 'admin', 'user2'],
        },
        route: {
          path: '/admin/delete'
        },
        method: 'PUT',
      };

      await middleware(req, null, (err = null) => {
        expect(err).to.eql(null);
      });
    });

    it('DENY to user', async () => {

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

    it('DENY to user in array', async () => {

      req = {
        user: {
          role: ['user', 'user1'],
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

    it('Null role throws error', async () => {

      expect(hrbac.addRole.bind(hrbac, null)).to.throw();
    });

    it('Empty role throws error', async () => {

      expect(hrbac.addRole.bind(hrbac, '')).to.throw();
    });

    it('Redifining admin role should throw error', async () => {

      expect(hrbac.addRole.bind(hrbac, 'admin')).to.throw();
    });

    it('Defining role named as function throws error', async () => {

      expect(hrbac.addRole.bind(hrbac, 'test_func1')).to.throw();
    });
  });
});

describe('Role with single parent', () => {

  it('Non existant parent throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, 'admin2', 'admin3')).to.throw();
  });

  it('Role should access route for its parent', async () => {

    hrbac.addRole('admin3');

    hrbac.addRole('admin2', 'admin3');

    middleware = hrbac.middleware('admin3');

    req = {
      user: {
        role: ['admin2'],
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });
  });

  it('Role should access route for its ancestor', async () => {

    hrbac.addRole('admin4');

    hrbac.addRole('admin5', 'admin4');

    hrbac.addRole('admin6', 'admin5');

    middleware = hrbac.middleware('admin4');

    req = {
      user: {
        role: ['admin6'],
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });
  });
});

describe('Role with array of parents', () => {

  it('Non existant parent throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, 'admin7', ['admin8', 'admin9'])).to.throw();
  });

  it('Role should access route for its parent in array', async () => {

    hrbac.addRole('admin8');
    hrbac.addRole('admin9');

    hrbac.addRole('admin7', ['admin8', 'admin9']);

    middleware = hrbac.middleware('admin9');

    req = {
      user: {
        role: ['admin7'],
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });
  });

  it('Role should access route for its ancestor in array', async () => {

    hrbac.addRole('admin10');
    hrbac.addRole('admin11');

    hrbac.addRole('admin12', ['admin10', 'admin11']);

    hrbac.addRole('admin13');

    hrbac.addRole('admin14', ['admin12', 'admin13']);

    middleware = hrbac.middleware('admin9');

    req = {
      user: {
        role: ['admin7'],
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });
  });

  // it('Role should not access route if no ancestor has access', async () => {

  //   hrbac.addRole('admin8');
  //   hrbac.addRole('admin9');

  //   hrbac.addRole('admin7', ['admin8', 'admin9']);

  //   middleware = hrbac.middleware('admin9');

  //   req = {
  //     user: {
  //       role: ['admin7'],
  //     },
  //     route: {
  //       path: '/admin/delete'
  //     },
  //     method: 'PUT',
  //   };

  //   await middleware(req, null, (err = null) => {
  //     expect(err).to.eql(null);
  //   });
  // });
});