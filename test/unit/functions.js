process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const NullParameterError       = require('../../lib/errors/NullParameterError');
const EmptyParameterError      = require('../../lib/errors/EmptyParameterError');
const LabelAlreadyInUseError   = require('../../lib/errors/LabelAlreadyInUseError');
const MissingFunctionError     = require('../../lib/errors/MissingFunctionError');
const UndefinedParameterError  = require('../../lib/errors/UndefinedParameterError');
const NotAStringError          = require('../../lib/errors/NotAStringError');
const NotAFunctionError        = require('../../lib/errors/NotAFunctionError');

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe('addBoolFunc error throwing:', () => {
  
  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Undef label throws error', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac)).to.throw(UndefinedParameterError);
  });

  it('Undef func throws error', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, 'func')).to.throw(UndefinedParameterError);
  });

  it('Null label throws error', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, null)).to.throw(NullParameterError);
  });

  it('Null function throws error', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, null, null)).to.throw(NullParameterError);
  });

  it('Empty label throws error', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, '')).to.throw(EmptyParameterError);
  });

  it('Label must be a string', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, 5)).to.throw(NotAStringError);
  });

  it('Second argument must be a function', async () => {

    expect(hrbac.addBoolFunc.bind(hrbac, 'ciccio', 'rocco')).to.throw(NotAFunctionError);
  });

  it('Redifining label for function role should throw error', async () => {

    hrbac.addBoolFunc('func', () => 5);

    expect(hrbac.addBoolFunc.bind(hrbac, 'func', () => 6)).to.throw(LabelAlreadyInUseError);
  });

  it('Using role as label for function role should throw error', async () => {

    hrbac.addRole('admin');

    expect(hrbac.addBoolFunc.bind(hrbac, 'admin', () => 6)).to.throw(LabelAlreadyInUseError);
  });
});

describe('Function granting', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('GRANT when func is true', async () => {

    req = {
      user: {
        role: 'admin',
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
    };

    hrbac.addBoolFunc('func', (req, res) => req.user.role === 'admin');

    middleware = hrbac.middleware('func');

    await middleware(req, null, (err = null) => {
      expect(err).to.eql(null);
    });
  });

  it('DENY when function is false', async () => {

    req = {
      user: {
        role: 'user',
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
    });
  });

});

describe('OR function error throwing:', () => {
  
  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Undef first argument throws error', async () => {

    expect(hrbac.or.bind(hrbac)).to.throw(UndefinedParameterError);
  });

  it('Null first argument throws error', async () => {

    expect(hrbac.or.bind(hrbac, null)).to.throw(NullParameterError);
  });

  it('First argument must be a function', async () => {

    expect(hrbac.or.bind(hrbac, 5)).to.throw(NotAFunctionError);
  });

  it('If first argument is a string it must correspond to a function', async () => {

    expect(hrbac.or.bind(hrbac, 'func1')).to.throw(MissingFunctionError);
  });

  it('Undef second argument throws error', async () => {

    expect(hrbac.or.bind(hrbac, () => 5)).to.throw(UndefinedParameterError);
  });

  it('Null second argument throws error', async () => {

    expect(hrbac.or.bind(hrbac, () => 5, null)).to.throw(NullParameterError);
  });

  it('Second argument must be a function', async () => {

    expect(hrbac.or.bind(hrbac, () => 5, 5)).to.throw(NotAFunctionError);
  });

  it('If second argument is a string it must correspond to a function', async () => {

    expect(hrbac.or.bind(hrbac, () => 5, 'func2')).to.throw(MissingFunctionError);
  });
});

describe('AND function error throwing:', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Undef first argument throws error', async () => {

    expect(hrbac.and.bind(hrbac)).to.throw(UndefinedParameterError);
  });

  it('Null first argument throws error', async () => {

    expect(hrbac.and.bind(hrbac, null)).to.throw(NullParameterError);
  });

  it('First argument must be a function', async () => {

    expect(hrbac.and.bind(hrbac, 5)).to.throw(NotAFunctionError);
  });

  it('If first argument is a string it must correspond to a function', async () => {

    expect(hrbac.and.bind(hrbac, 'func1')).to.throw(MissingFunctionError);
  });

  it('Undef second argument throws error', async () => {

    expect(hrbac.and.bind(hrbac, () => 5)).to.throw(UndefinedParameterError);
  });

  it('Null second argument throws error', async () => {

    expect(hrbac.and.bind(hrbac, () => 5, null)).to.throw(NullParameterError);
  });

  it('Second argument must be a function', async () => {

    expect(hrbac.and.bind(hrbac, () => 5, 5)).to.throw(NotAFunctionError);
  });

  it('If second argument is a string it must correspond to a function', async () => {

    expect(hrbac.and.bind(hrbac, () => 5, 'func2')).to.throw(MissingFunctionError);
  });
});

describe('NOT function error throwing:', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  it('Undef argument throws error', async () => {

    expect(hrbac.and.bind(hrbac)).to.throw(UndefinedParameterError);
  });

  it('Null argument throws error', async () => {

    expect(hrbac.and.bind(hrbac, null)).to.throw(NullParameterError);
  });

  it('Argument must be a function', async () => {

    expect(hrbac.and.bind(hrbac, 5)).to.throw(NotAFunctionError);
  });

  it('If argument is a string it must correspond to a function', async () => {

    expect(hrbac.and.bind(hrbac, 'func1')).to.throw(MissingFunctionError);
  });
});

let ORTests = async (middleware) => {
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
    expect(err).to.eql(null);
  });

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
    expect(err).to.not.eql(null);
  });
};

let ANDTests = async (middleware) => {
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
    expect(err).to.not.eql(null);
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
    expect(err).to.not.eql(null);
  });
};

describe.only('Function combination', () => {

  beforeEach(() => {
    hrbac = new HRBAC();
  });

  afterEach(() => {
  });

  it('Basic OR with direct functions', async () => {

    middleware = hrbac.middleware(hrbac.or(() => req.user.role === 'admin', () => req.method === 'PUT'));

    await ORTests(middleware);
  });

  it('Basic OR with arg1 = label function and arg2 = lambda functions', async () => {

    hrbac.addBoolFunc('is admin', () => req.user.role === 'admin');

    middleware = hrbac.middleware(hrbac.or('is admin', () => req.method === 'PUT'));

    await ORTests(middleware);
  });

  it('Basic OR with arg1 = lambda function and arg2 = label functions', async () => {

    hrbac.addBoolFunc('is PUT', () => req.method === 'PUT');

    middleware = hrbac.middleware(hrbac.or(() => req.user.role === 'admin', 'is PUT'));

    await ORTests(middleware);
  });

  it('Basic AND with direct functions', async () => {

    middleware = hrbac.middleware(hrbac.and(() => req.user.role === 'admin', () => req.method === 'PUT'));

    await ANDTests(middleware);
  });

  it('Basic AND with arg1 = label function and arg2 = lambda functions', async () => {

    hrbac.addBoolFunc('is admin', () => req.user.role === 'admin');

    middleware = hrbac.middleware(hrbac.and('is admin', () => req.method === 'PUT'));

    await ANDTests(middleware);
  });

  it('Basic AND with arg1 = lambda function and arg2 = label functions', async () => {

    hrbac.addBoolFunc('is PUT', () => req.method === 'PUT');

    middleware = hrbac.middleware(hrbac.and(() => req.user.role === 'admin', 'is PUT'));

    await ANDTests(middleware);
  });

  it('Basic NOT with direct functions', async () => {

    middleware = hrbac.middleware(hrbac.not(() => req.user.role === 'admin'));

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
      expect(err).to.eql(null);
    });

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
      expect(err).to.not.eql(null);
    });
  });

  it('Basic NOT with label functions', async () => {

    hrbac.addBoolFunc('is admin', () => req.user.role === 'admin');
    
    middleware = hrbac.middleware(hrbac.not('is admin'));

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
      expect(err).to.eql(null);
    });

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
      expect(err).to.not.eql(null);
    });
  });
});

