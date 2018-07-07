process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const HRBAC = require('../../lib/hrbac');

const NullParameterError       = require('../../lib/errors/NullParameterError');
const EmptyParameterError      = require('../../lib/errors/EmptyParameterError');
const LabelAlreadyInUseError   = require('../../lib/errors/LabelAlreadyInUseError');
const RoleAlreadyExistsError   = require('../../lib/errors/RoleAlreadyExistsError');
const MissingRoleError         = require('../../lib/errors/MissingRoleError');
const UndefinedParameterError  = require('../../lib/errors/UndefinedParameterError');
const NotAStringError          = require('../../lib/errors/NotAStringError');
const ParameterNumberMismatchError  = require('../../lib/errors/ParameterNumberMismatchError');

let hrbac;

request = {};
response = {};

describe('Role error throwing:', () => {
  
  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Undef role throws error', async () => {

    expect(hrbac.addRole.bind(hrbac)).to.throw(UndefinedParameterError);
  });

  it('Null role throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, null)).to.throw(NullParameterError);
  });

  it('Empty role throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, '')).to.throw(EmptyParameterError);
  });

  it('Parameter must be a string', async () => {

    expect(hrbac.addRole.bind(hrbac, 5)).to.throw(NotAStringError);
  });

  it('Redifining admin role should throw error', async () => {

    hrbac.addRole('admin');

    expect(hrbac.addRole.bind(hrbac, 'admin')).to.throw(RoleAlreadyExistsError);
  });

  it('Defining role named as function throws error', async () => {

    hrbac.addBoolFunc('test_func1', (req, res) => 5);

    expect(hrbac.addRole.bind(hrbac, 'test_func1')).to.throw(LabelAlreadyInUseError);
  });
});

describe('Role admin without parent', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
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

      hrbac.addRole('admin');

      middleware = hrbac.middleware('admin');

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

      hrbac.addRole('admin');

      middleware = hrbac.middleware('admin');

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

      hrbac.addRole('admin');

      middleware = hrbac.middleware('admin');

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

      hrbac.addRole('admin');

      middleware = hrbac.middleware('admin');

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

      hrbac.addRole('admin');

      middleware = hrbac.middleware('admin');

      await middleware(req, null, (err = null) => {
        expect(err).to.not.eql(null);
      });
    });
  });
});

describe('addGetRoleFunc', () => {

  describe('sync func', () => {
    beforeEach(() => {
      hrbac = new HRBAC();

      hrbac.addGetRoleFunc((req, res) => req.user.myrole)
    });

    afterEach(() => {
    });

    it('Function takes 2 arguments', async () => {

      expect(hrbac.addGetRoleFunc.bind(hrbac, () => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addGetRoleFunc.bind(hrbac, (req) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addGetRoleFunc.bind(hrbac, (req, res, ciccio) => 5)).to.throw(ParameterNumberMismatchError);
    });

    describe('should GRANT to admin', () => {
      it('GRANT to admin', async () => {

        req = {
          user: {
            myrole: 'admin',
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('GRANT to admin role in array', async () => {

        req = {
          user: {
            myrole: ['admin'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('GRANT to admin role in array with other roles', async () => {

        req = {
          user: {
            myrole: ['user1', 'admin', 'user2'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('DENY to user', async () => {

        req = {
          user: {
            myrole: 'user',
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.not.eql(null);
        });
      });

      it('DENY to user in array', async () => {

        req = {
          user: {
            myrole: ['user', 'user1'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.not.eql(null);
        });
      });
    });
  });

  describe('async func', () => {
    beforeEach(() => {
      hrbac = new HRBAC();

      hrbac.addGetRoleFunc(async (req, res) => req.user.myrole)
    });

    afterEach(() => {
    });

    it('Function takes 2 arguments', async () => {

      expect(hrbac.addGetRoleFunc.bind(hrbac, () => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addGetRoleFunc.bind(hrbac, (req) => 5)).to.throw(ParameterNumberMismatchError);
      expect(hrbac.addGetRoleFunc.bind(hrbac, (req, res, ciccio) => 5)).to.throw(ParameterNumberMismatchError);
    });

    describe('should GRANT to admin', () => {
      it('GRANT to admin', async () => {

        req = {
          user: {
            myrole: 'admin',
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('GRANT to admin role in array', async () => {

        req = {
          user: {
            myrole: ['admin'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('GRANT to admin role in array with other roles', async () => {

        req = {
          user: {
            myrole: ['user1', 'admin', 'user2'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.eql(null);
        });
      });

      it('DENY to user', async () => {

        req = {
          user: {
            myrole: 'user',
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.not.eql(null);
        });
      });

      it('DENY to user in array', async () => {

        req = {
          user: {
            myrole: ['user', 'user1'],
          },
          route: {
            path: '/admin/delete'
          },
          method: 'PUT',
        };

        hrbac.addRole('admin');

        middleware = hrbac.middleware('admin');

        await middleware(req, null, (err = null) => {
          expect(err).to.not.eql(null);
        });
      });
    });
  });
});

describe('Role with single parent', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('Non existant parent throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, 'admin1', 'admin2')).to.throw(MissingRoleError);
  });

  it('Role should access route for its parent', async () => {

    hrbac.addRole('admin2');

    hrbac.addRole('admin1', 'admin2');

    middleware = hrbac.middleware('admin2');

    req = {
      user: {
        role: ['admin1'],
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

    hrbac.addRole('admin3');

    hrbac.addRole('admin2', 'admin3');

    hrbac.addRole('admin1', 'admin2');

    middleware = hrbac.middleware('admin3');

    req = {
      user: {
        role: ['admin1'],
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

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('Non existant parent throws error', async () => {

    expect(hrbac.addRole.bind(hrbac, 'admin1', ['admin2', 'admin3'])).to.throw(MissingRoleError);
  });

  it('Role should access route for its parent in array', async () => {

    hrbac.addRole('admin2');
    hrbac.addRole('admin3');

    hrbac.addRole('admin1', ['admin2', 'admin3']);

    middleware = hrbac.middleware('admin2');

    req = {
      user: {
        role: ['admin1'],
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

    hrbac.addRole('admin4');
    hrbac.addRole('admin5');

    hrbac.addRole('admin2', ['admin4', 'admin5']);

    hrbac.addRole('admin3');

    hrbac.addRole('admin1', ['admin2', 'admin3']);

    middleware = hrbac.middleware('admin5');

    req = {
      user: {
        role: ['admin1'],
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