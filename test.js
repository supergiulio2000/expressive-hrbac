'use strict';

(async () => {

  try {

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

    let hrbac = new HRBAC();

    hrbac.addRole('admin');

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
  } catch (err) {
    console.log(err);
  }
})();