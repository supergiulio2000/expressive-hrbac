'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');

    let req = {
      user: {
        //roles: ['admin']
        role: ['admin', 'user']
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 10
      }
    }

    hrbac.addGetRoleFunc(req => req.user.myRole);

    hrbac.addRole('admin');

    {
      let middleware = hrbac.middleware('admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac.addBoolFunc('is group owner', async (req) => req.params.groupId == 10);

    hrbac.addRole('user');

    hrbac.addBoolFunc(
      'is admin or group owner',
      hrbac.or('admin', hrbac.and('user', 'is group owner'))
    );

    {
      let middleware = hrbac.middleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    {
      let middleware = hrbac.middleware(hrbac.not('is admin or group owner'));

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }
  } catch (err) {
    console.log(err);
  }
})();