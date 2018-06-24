'use strict';

(async () => {

  try {

    const hrbac = require('./lib/index');

    let req = {
      user: {
        roles: ['admin']
      },
      route: {
        path: '/admin/delete'
      },
      method: 'PUT',
      params: {
        groupId: 9
      }
    }

    // let middleware = hrbac.getMiddleware(['admin']);

    // if(await middleware(req, null, (err = null) => console.log(err ? err : 'OK'))) {
    //   console.log('PERMISSION!');
    // }

    //middleware = hrbac.getMiddleware2().roleIn(['admin']).or.when(async req => req.params.groupId == 10);

    let middleware = hrbac.getMiddleware3(
      async (req) => 
        hrbac.roleIn(req, ['admin']) ||
        await hrbac.if(req, async req => req.params.groupId == 10)
    );

    // let middleware = hrbac.getMiddleware3(
    //   async (req) => {
    //     console.log('Condition');
    //     console.log(req);
    //     return hrbac.roleIn(req, ['admin'])
    //   }
    // );

    await middleware(req, null, (err = null) => console.log(err ? err : 'OK'));

  } catch (err) {
    console.log(err);
  }
})();