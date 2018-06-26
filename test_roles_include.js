/* EXAMPLE 1
  admin has parent user: admin can access what user can access
  user has parent guest: user can access what guest can access

  Rule has been set to admin access

  Request role is user

  Reruls: deny access
*/

{
  let reqRole = ['user', 'guest'];

  let ruleRole = 'admin';

  if (reqRole.includes(ruleRole)) {
    console.log('GRANT');
  } else {
    console.log('DENY');
  }
}

/* EXAMPLE 1
  admin has parent user: admin can access what user can access
  user has parent guest: user can access what guest can access

  Rule has been set to user access

  Request role is admin

  Reruls: grant access
*/

{
  let reqRole = ['admin', 'user', 'guest'];

  let ruleRole = 'user';

  if (reqRole.includes(ruleRole)) {
    console.log('GRANT');
  } else {
    console.log('DENY');
  }
}