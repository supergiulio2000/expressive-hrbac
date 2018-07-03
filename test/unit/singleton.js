process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;

const RoleAlreadyExistsError   = require('../../lib/errors/RoleAlreadyExistsError');

const HRBAC = require('../../lib/hrbac');

let hrbac;

request = {};
response = {};

describe('Singleton', () => {

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
