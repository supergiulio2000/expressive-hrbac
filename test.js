'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');

    let req = {
      user: {
        //roles: ['admin']
        role: ['admino', 'user']
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 9
      }
    }

    hrbac.addRole('admin');

    {
      let middleware = hrbac.generateMiddleware('admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac.addBoolFunc('is group owner', async (req) => {

      console.log(req.params.groupId);
      return req.params.groupId == 10
    });

    hrbac.addRole('user');

    hrbac.addBoolFunc(
      'is admin or group owner',
      hrbac.or('admin', hrbac.and('user', 'is group owner'))
    );

    {
      let middleware = hrbac.generateMiddleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    {
      let middleware = hrbac.generateMiddleware(hrbac.not('is admin or group owner'));

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }
  } catch (err) {
    console.log(err);
  }
})();