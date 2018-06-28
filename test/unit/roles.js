process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
var assert = require('assert');
var expect = chai.expect;
const httpMocks = require('node-mocks-http');

const hrbac = require('../../lib/index');

request = {};
response = {};

describe('rules', () => {

  beforeEach(() => {
    request = httpMocks.createRequest({
      method: 'GET',
      url: '/test/path?myid=312',
      query: {
          myid: '312'
      }
    });
  });

  afterEach(() => {
  });

  describe('should GRANT', () => {
    it('GRANT to admin', async () => {
      //hrbac.addRole('admin', ['user1', 'user2']);
      'ciccio'.should.eql('ciccio');
    });
  });
});
