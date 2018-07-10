process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;


const EmptyParameterError      = require('../../lib/errors/EmptyParameterError');
const NotAStringError               = require('../../lib/errors/NotAStringError');
const RoleAlreadyExistsError   = require('../../lib/errors/RoleAlreadyExistsError');

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe('Singleton', () => {

  it('getInstance() throws error if label is an emmty string', async () => {

    expect(HRBAC.getInstance.bind(HRBAC, '')).to.throw(EmptyParameterError);
  });

  it('getInstance() throws error if label is provided but is not a valid string', async () => {

    expect(HRBAC.getInstance.bind(HRBAC, 5)).to.throw(NotAStringError);
  });

  it('Throws RoleAlreadyEsists when you get instance twice and create same role', async () => {

    hrbac = HRBAC.getInstance();

    hrbac.addRole('admin');

    hrbac = HRBAC.getInstance();

    expect(hrbac.addRole.bind(hrbac, 'admin')).to.throw(RoleAlreadyExistsError);
  });

  it('Throws RoleAlreadyEsists when you get the same instance using label twice and create same role', async () => {

    hrbac = HRBAC.getInstance('gino');

    hrbac.addRole('admin');

    hrbac = HRBAC.getInstance('gino');

    expect(hrbac.addRole.bind(hrbac, 'admin')).to.throw(RoleAlreadyExistsError);
  });

  it('Does not throws RoleAlreadyEsists when you get diffrent instance using label and create same role', async () => {

    hrbac = HRBAC.getInstance('rino');

    hrbac.addRole('admin');

    hrbac = HRBAC.getInstance('pino');

    expect(hrbac.addRole.bind(hrbac, 'admin')).not.to.throw(RoleAlreadyExistsError);
  });

});
