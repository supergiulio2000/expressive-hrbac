process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const HRBAC = require('../../lib/hrbac');

const NullParameterError            = require('../../lib/errors/NullParameterError');
const EmptyParameterError           = require('../../lib/errors/EmptyParameterError');
const LabelAlreadyInUseError        = require('../../lib/errors/LabelAlreadyInUseError');
const RoleAlreadyExistsError        = require('../../lib/errors/RoleAlreadyExistsError');
const MissingRoleError              = require('../../lib/errors/MissingRoleError');
const UndefinedParameterError       = require('../../lib/errors/UndefinedParameterError');
const NotAStringError               = require('../../lib/errors/NotAStringError');
const NotAFunctionError             = require('../../lib/errors/NotAFunctionError');
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

describe('Should DENY if role is not valid in request object', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('Error while getting role from request object casue denial', async () => {

    req = {
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addRole('admin');

    middleware = hrbac.middleware('admin');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.message).to.eql('Unauthorized');
    });
  });

  it('Role undefined in request object cause denial', async () => {

    req = {
      user: {},
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addRole('admin');

    middleware = hrbac.middleware('admin');

    await middleware(req, null, (err = null) => {
      expect(err).to.not.eql(null);
      expect(err.message).to.eql('Unauthorized');
    });
  });

  it('Role null in request object cause denial', async () => {

    req = {
      user: {
        role: null
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
      expect(err.message).to.eql('Unauthorized');
    });
  });

  it('Role not a string in request object cause denial', async () => {

    req = {
      user: {
        role: 5
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
      expect(err.message).to.eql('Unauthorized');
    });
  });


  it('Role is a empty a string in request object cause denial', async () => {

    req = {
      user: {
        role: ''
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
      expect(err.message).to.eql('Unauthorized');
    });
  });

  it('Role is an array but not and array of strings a string in request object cause denial', async () => {

    req = {
      user: {
        role: ['admin', 'user', {}]
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
      expect(err.message).to.eql('Unauthorized');
    });
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

    it('Undef first argument throws error', async () => {

      expect(hrbac.addGetRoleFunc.bind(hrbac)).to.throw(UndefinedParameterError);
    });
  
    it('Null first argument throws error', async () => {
  
      expect(hrbac.addGetRoleFunc.bind(hrbac, null)).to.throw(NullParameterError);
    });
  
    it('First argument must be a function', async () => {
  
      expect(hrbac.addGetRoleFunc.bind(hrbac, 5)).to.throw(NotAFunctionError);
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

    it('Undef first argument throws error', async () => {

      expect(hrbac.addGetRoleFunc.bind(hrbac)).to.throw(UndefinedParameterError);
    });
  
    it('Null first argument throws error', async () => {
  
      expect(hrbac.addGetRoleFunc.bind(hrbac, null)).to.throw(NullParameterError);
    });
  
    it('First argument must be a function', async () => {
  
      expect(hrbac.addGetRoleFunc.bind(hrbac, 5)).to.throw(NotAFunctionError);
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

describe('idDescendantOf()', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  describe('Errors', () => {
    it('Descendant undefined', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac)).to.throw(UndefinedParameterError);
    });
    it('Parent undefined', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 'admin')).to.throw(UndefinedParameterError);
    });
    it('Descendant null', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, null, 'superadmin')).to.throw(NullParameterError);
    });
    it('Parent null', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 'admin', null)).to.throw(NullParameterError);
    });
    it('Descendant empty string', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, '', 'superadmin')).to.throw(EmptyParameterError);
    });
    it('Parent empty string', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 'admin', '')).to.throw(EmptyParameterError);
    });
    it('Descendant not a string', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 5, 'superadmin')).to.throw(NotAStringError);
    });
    it('Parent not a string', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 'admin', 5)).to.throw(NotAStringError);
    });
    it('Descendant role non-existant', async () => {
      expect(hrbac.idDescendantOf.bind(hrbac, 'non-existant', 'non-existant2')).to.throw(MissingRoleError);
    });
    it('Parent role non-existant', async () => {
      hrbac.addRole('admin');
      expect(hrbac.idDescendantOf.bind(hrbac, 'admin', 'non-existant2')).to.throw(MissingRoleError);
    });
  });

  describe('invocations', () => {
    it('Descendant is direct children of ancestor', async () => {
      hrbac.addRole('admin');
      hrbac.addRole('superadmin', 'admin');
      expect(hrbac.idDescendantOf('superadmin', 'admin')).to.eql(true);
    });

    it('Descendant is nethew of ancestor', async () => {
      hrbac.addRole('user')
      hrbac.addRole('admin', 'user');
      hrbac.addRole('superadmin', 'admin');
      expect(hrbac.idDescendantOf('superadmin', 'user')).to.eql(true);
    });

    it('Descendant is not related to ancestor', async () => {
      hrbac.addRole('user')
      hrbac.addRole('admin', 'user');
      hrbac.addRole('superadmin');
      expect(hrbac.idDescendantOf('superadmin', 'user')).to.eql(false);
    });
  });
});