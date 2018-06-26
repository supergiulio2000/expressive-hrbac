'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');

    let req = {
      user: {
        //roles: ['admin']
        role: ['admino', 'usero']
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 10
      }
    }

    hrbac.addRole('admin');

    {
      let middleware = hrbac.getMiddleware('admin');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }

    hrbac.addBool('is group owner', async (req) => {

      console.log(req.params.groupId);
      return req.params.groupId == 10
    });

    hrbac.addRole('user');

    //hrbac.addBool('is admin or group owner', hrbac.or('admin', 'is group owner'));

    //hrbac.addMiddleware('is admin or group owner', hrbac.getBool('is admin or group owner'));

    hrbac.addMiddleware(
      'is admin or group owner',
      hrbac.or('admin', hrbac.and('user', 'is group owner'))
    );

    {
      let middleware = hrbac.getMiddleware('is admin or group owner');

      await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));
    }


  } catch (err) {
    console.log(err);
  }
})();