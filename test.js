'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');

    let req = {
      user: {
        //roles: ['admin']
        role: 'admin0'
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 10
      }
    }

    hrbac.addBool('is admin', async (req) => req.user.role == 'admin');

    hrbac.addMiddleware('is admin', hrbac.getBool('is admin'));

    {
      let middleware = hrbac.getMiddleware('is admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac.addBool('is group owner', async (req) => req.params.groupId == 10);

    hrbac.addBool('is admin or group owner', hrbac.or('is admin', 'is group owner'));

    hrbac.addMiddleware('is admin or group owner', hrbac.getBool('is admin or group owner'));

    {
      let middleware = hrbac.getMiddleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

  } catch (err) {
    console.log(err);
  }
})();