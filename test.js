'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');
    const HRBAC = require('./lib/hrbac');

    let req = {
      user: {
        //roles: ['admin']
        role: ['admin'],
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 9
      }
    }

    hrbac.addGetRoleFunc((req, res) => req.user.role);

    hrbac.addRole('sfigato1');

    hrbac.addRole('sfigato2');

    hrbac.addRole('guest', ['sfigato1', 'sfigato2']);

    hrbac.addRole('user1', ['guest']);

    hrbac.addRole('user2');

    hrbac.addRole('admin', ['user1', 'user2']);


    {
      let middleware = hrbac.middleware('admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac.addBoolFunc('is group owner', async (req, res) => req.params.groupId == 10);

    hrbac.addRole('user');

    hrbac.addBoolFunc(
      'is admin or group owner',
      hrbac.or('admin', hrbac.and('user',  'is group owner'))
    );

    {
      let middleware = hrbac.middleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    {
      let middleware = hrbac.middleware(hrbac.not('is admin or group owner'));

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    let hrbac2 = new HRBAC();

    hrbac2.addRole('admin');

    {
      let middleware = hrbac2.middleware('admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac2.addBoolFunc('is group owner', async (req, res) => req.params.groupId == 10);

    hrbac2.addRole('user');

    hrbac2.addBoolFunc(
      'is admin or group owner',
      hrbac2.or('admin', hrbac2.and('user',  'is group owner'))
    );

    {
      let middleware = hrbac2.middleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }
  } catch (err) {
    console.log(err);
  }
})();