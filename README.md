# expressive-hrbac
Expressjs middleware builder to easily produce arbitrary Hierarchical Role-Based Access Control middleware with resource granularity.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
- [The problems it solves](#the-problems-it-solves)
- [Phylosophy](#phylosophy)
- [Installation](#installation)
- [Usage examples](#usage-examples)
  - [Grant access to role `admin`](#grant-access-to-role-admin)
  - [Associate functions to labels for easy reference](#associate-functions-to-labels-for-easy-reference)
  - [Logically combine functions](#logically-combine-functions)
  - [Roles](#roles)
  - [Role inheritance](#role-inheritance)
  - [Singleton](#singleton)
  - [Named singleton](#named-singleton)
- [Methods](#methods)
  - [addRole(role, parents = null)](#addrolerole-parents--null)
  - [addGetRoleFunc(func)](#addgetrolefuncfunc)
  - [addBoolFunc(label, func)](#addboolfunclabel-func)
  - [or(func1, func2)](#orfunc1-func2)
  - [and(func1, func2)](#andfunc1-func2)
  - [not(func)](#notfunc)
  - [middleware(func)](#middlewarefunc)
  - [getInstance(label = null)](#getinstancelabel--null)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# The problems it solves
* Provide access to a given resource only when the user has been awarded a certain role.

   Example: admin can edit any blog posts.

* Provide access to a given resource only when a user has a particular right on the resource

   Example: user can edit his own blog posts but not the posts from other users

* Provide a way of combining logically any condition on roles or resouce access

   Example: a blog post can be edited by admin or by user when he is the blog owner.

And much more...

# Phylosophy
**expressive-hrbac** is function-based. You provide synchounous or asynchrounous functions that take the request and response objects as input and return a true boolean when access must be granted or a false boolean when access must be denied.

**expressive-hrbac** provide ways to build easy-to-reuse middleware from logical combinations of such functions.

# Installation
```sh
npm install expressive-hrbac --save
```

# Usage examples
## Grant access to role `admin`
First build a function that return true when the user has role `admin`.
```js
(req, res) => req.user.role ==== 'admin'
```

A middleware can be created from such function using method `middleware()`.

```js
const router = require('express').Router();

const hrbac = require('expressive-hrbac');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware((req, res) => req.user.role === 'admin'),
  controller
); 
```

Maybe you prefer asynchronous functions:

```js
router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware(async (req, res) => req.user.role === 'admin'),
  controller
); 
```

## Associate functions to labels for easy reference
If you intend to use a function for more than one route you can avoid repeating its definition. You can associate it to a label using method `addBoolFunc()`.

```js
hrbac.addBoolFunc('is admin', async (req, res) => req.user.role === 'admin'));

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('is admin'),
  controller
);

router.put(
  '/blogs/:blogId/comments/:commentId',
  hrbac.middleware('is admin'),
  controller
); 
```

**NOTE**: function `middleware()` can be passed a synchounous/asynchrounous function or a string label associated to a function. This is true for every method that accepts functions.

## Logically combine functions
Suppose you want to grant access to role `admin` or to role `user` but only when `user` is the owner of the blog post, you first create all the functions you need and then combine everything in a single function using methods `and()`, `or()`, `not()`.

```js
hrbac.addBoolFunc('is admin', (req, res) => req.user.role = 'admin'));
hrbac.addBoolFunc('is user', (req, res) => req.user.role = 'user'));
hrbac.addBoolFunc('is post owner', async (req, res) => await Posts.findById(req.params.postId).ownerId === req.user.id ));

hrbac.addBoolFunc(
  'is admin or post owner user',
  hrbac.or(
    'is admin',
    hrbac.and(
      'is user',
      'is post owner'
    )
  )
);

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('is admin or post owner user'),
  controller
); 
```

## Roles
So far we have used roles improperly. You should not provide functions checking for roles but use the `addRole()` method instead.

```js
hrbac.addRole('admin');
```

By so doing **expressive-hrbac** will automatically add a boolean function that checks for the `admin` role and associated it to label `admin`.

```js
hrbac.addRole('admin');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
);
```

> **NOTE**: as soon as you define a role, you can NOT use the role string as a label for you custom functions.

The role functions can be combined with other funcitons. You simply reference to it with the role string itself. For example here we provide access to `admin` or to any user with ID different from 10 (silly example!),.

```js
hrbac.addRole('admin');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware(
    hrbac.or(
      'admin',
      hrbac.not((req, res) => req.user.userId == 10)
    ),
    controller
  )
);
```

By deafult, **expressive-hrbac** will look into `req.user.role` for the user role. You can change that behaviour providing a function that returns the role from the request object with method `addGetRoleFunc()`.

```js
hrbac.addGetRoleFunc((req, res) => req.user.myRole);

hrbac.addRole('admin');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
);
```

The role defined in the request object can be an array of roles. Meaning that a user can have multiple roles and **expressive-hrbac** will check if any one of them can be granted access.

```js
// assume req.user.role = ['admin', 'blog_admin']

hrbac.addRole('admin');

// Middleware below will GRANT access as user has role `admin` in its list of roles
router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
);
```

## Role inheritance
A role can have parent roles, inheriting all access permissions from each parent role. If access is not granted for the role, a second check will be attenped for each parent role, and for each parent role of each parent role and so on.

Inherited parents are declared as a second argument of the `addRole()` method.

Suppose role `superadmin` should be able to access every resource that `admin` can access.

```js
hrbac.addRole('admin');
hrbac.addRole('superadmin', 'admin');
```
> **NOTE**: a role must have been added before we can inherit from it

In case `superadmin` should inherit from both `admin` and `blog_admin` you pass an array as the second parameter.

```js
hrbac.addRole('admin');
hrbac.addRole('blog_admin');
hrbac.addRole('superadmin', ['admin', `blog_admin`]);
```
Now if `superadmin` does not get access, **expressive-hrbac** will try again with role `admin` and in case of failure with role `blog_admin`.

If `blog_admin` further inherited from `user`, then if `superadmin` does not get access, **expressive-hrbac** will try again with role `admin`, role `blog_admin` and role `user` traversing the inheritance tree.

```js
hrbac.addRole('user');
hrbac.addRole('blog_admin','user');
hrbac.addRole('admin');
hrbac.addRole('superadmin', ['admin', 'blog_admin']);
```

> **NOTE**: when the request object contains an array of roles, the inheritance will be activated for each role in the array.

## Singleton
So far we have worked with single instances of the HRBAC class. This might not be what you usually want. Maybe you want to centralize your Access Control. To do so you can use the `getInstance()` method to get a singleton so that you can easily access your Access Control from anywhere in your application.

<span style="color:gray">file1.js</span>
```js
const HRBAC = require('expressive-hrbac');

let hrbac = HRBAC.getInstance();

hrbac.addRole('admin');
```

<span style="color:gray">file2.js</span>
```js
const hrbac = require('expressive-hrbac');

let hrbac = HRBAC.getInstance();

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
); 

```

## Named singleton
In some cases you neither want a different instance each time you use your Access Control neither a unique singleton for the entire application. You might need to have to concentrate your Access Control in a few points of your application. In those cases you can use named singletons by simply passing a label to the `getInstance()` method. The first time you invoke the `getInstance()` method with a label, **expressive-hrbac** will create a new instance for you and then it will return it for each subsequent invocations with the same label.

<span style="color:gray">file1.js</span>
```js
const HRBAC = require('expressive-hrbac');

let hrbac = HRBAC.getInstance('main');

hrbac.addRole('admin');
```

<span style="color:gray">file2.js</span>
```js
const hrbac = require('expressive-hrbac');

let hrbac = HRBAC.getInstance('main');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
); 
```

<span style="color:gray">file3.js</span>
```js
const HRBAC = require('expressive-hrbac');

let hrbac = HRBAC.getInstance('content');

hrbac.addRole('admin');
```

<span style="color:gray">file4.js</span>
```js
const hrbac = require('expressive-hrbac');

let hrbac = HRBAC.getInstance('content');

router.put(
  '/blogs/:blogId/posts/:postId',
  hrbac.middleware('admin'),
  controller
);
```

# Errors
In case of denied access **expressive-hrbac** will call `next()` with a `401 Unauthorized` HTTP error.

In case of errors in the custom functions added using method `addBoolFunc()` **expressive-hrbac** will call `next()` with a `500 Internal Server Error` HTTP error.

# Methods

## addRole(role, parents = null)
Adds a role to the HRBAC instance. Also add a function associated to the role string.

**Parameters**:
-   `role`: [**string**] - The role string to be added
-   `parents`: (_optional_) [**string | string[]**] - The parent role or array of parent roles for this role

**Returns**:
-   [**HRBAC**] current HRBAC instance.

**Throws**:
-   `UndefinedParameterError`: When `role` is undefined.
-   `NullParameterError`: When `role` is null.
-   `EmptyParameterError`: When `role` is empty string.
-   `NotAStringError`: when `role` is not a string.
-   `RoleAlreadyExistsError`: If `role` already exists.
-   `LabelAlreadyInUseError`: If `role` has already been used as label for a function.
-   `MissingRoleError`: If any parent role has not been added yet.

## addGetRoleFunc(func)
Adds a function to get the role from the request object

**Parameters**:
-   `func`: [**sync/async function**] - Function to be called

**Returns**:
-   [**HRBAC**] current HRBAC instance.

**Throws**:
-   `UndefinedParameterError`: When `func` is undefined.
-   `NullParameterError`: When `func` is null.
-   `NotAFunctionError`: when `func` is not a sync/async function.
-   `ParameterNumberMismatchError`: when `func` does not take exactly 2 arguments.


## addBoolFunc(label, func)
Adds a boolean function and associates it to the provided label

**Parameters**:
-   `label`: [**string**] - The label to associate the function to
-   `func`: [**sync/async function**] - Function returning boolean.

**Returns**:
-   [**HRBAC**] current HRBAC instance.

**Throws**:
-   `UndefinedParameterError`: When `label` or `func` is undefined.
-   `NullParameterError`: When `label` or `func` is null.
-   `EmptyParameterError`: When `label` is empty string.
-   `NotAStringError`: when `label` is not a string.
-   `NotAFunctionError`: when `func` is not a sync/async function.
-   `LabelAlreadyInUseError`: If `label` has already been used as label.
-   `ParameterNumberMismatchError`: when `func` does not take exactly 2 arguments.

## or(func1, func2)
Combines two function with boolean OR.

**Parameters**:
-   `func1`: [**string | sync/async function**] - Label or actual function
-   `func2`: [**string | sync/async function**] - Label or actual function

**Returns**:
-   [**sync/async function**] - Combined function

**Throws**:
-   `UndefinedParameterError`: When `func1` or `func2` is undefined.
-   `NullParameterError`: When `func1` or `func2` is null.
-   `EmptyParameterError`: When `func1` or `func2` is a string which is empty.
-   `MissingFunctionError`: When `func1` or `func2` is a string but it is not associated to a function
-   `NotAFunctionError`: When `func1` or `func2` is not a string and it is not a sync/async function.
-   `ParameterNumberMismatchError`: when `func1` or `func2` is not a string and it is not a function which takes exactly 2 arguments.

## and(func1, func2)
Combines two function with boolean AND.

**Parameters**:
-   `func1`: [**string | sync/async function**] - Label or actual function
-   `func2`: [**string | sync/async function**] - Label or actual function

**Returns**:
-   [**sync/async function**] - Combined function

**Throws**:
-   `UndefinedParameterError`: When `func1` or `func2` is undefined.
-   `NullParameterError`: When `func1` or `func2` is null.
-   `EmptyParameterError`: When `func1` or `func2` is a string which is empty.
-   `MissingFunctionError`: If `func1` or `func2` is a string but it is not associated to a function.
-   `NotAFunctionError`: when `func1` or `func2` is not a string and it is not a sync/async function.
-   `ParameterNumberMismatchError`: when `func1` or `func2` is not a string and it is not a function which takes exactly 2 arguments.

## not(func)
Returnes negated function

**Parameters**:
-   `func`: [**string | sync/async function**] - Label or actual function

**Returns**:
-   [**sync/async function**] - Negated function

**Throws**:
-   `UndefinedParameterError`: When `func` is undefined.
-   `NullParameterError`: When `func` is null.
-   `EmptyParameterError`: When `func` is a string which is empty.
-   `MissingFunctionError`: If `func` is a string but it is not associated to a function
-   `NotAFunctionError`: when `func` is not a string and it is not a sync/async function.
-   `ParameterNumberMismatchError`: when `func` is not a string and it is not a function which takes exactly 2 arguments.

## middleware(func)
Returns middleware function.

**Parameters**:
-   `func`: [**string | sync/async function**] - Function label or actual function

**Returns**:
-   [**sync/async function**] - middleware

**Throws**:
-   `UndefinedParameterError`: When `func` is undefined.
-   `NullParameterError`: When `func` is null.
-   `EmptyParameterError`: When `func` is a string which is empty.
-   `MissingFunctionError`: If `func` is a string but it is not associated to a function
-   `NotAFunctionError`: when `func` is not a string and it is not a sync/async function.
-   `ParameterNumberMismatchError`: when `func` is not a string and it is not a function which takes exactly 2 arguments.

## getInstance(label = null)
Returns, and create if necessary, an HRBAC instance associated to `label`. If `label` is not provided will return an application-wide singleton.

**Parameters**:
-   `label`: (_optional_) [**string**] - label to associate the instance to. If not provided will return an application-wide singleton.

**Returns**:
-   [**HRBAC**] HRBAC instance associated to `label` if provided or  an application-wide singleton.

**Throws**:
-   `NullParameterError`: When `role` is null.
-   `EmptyParameterError`: When `role` is empty string.
-   `NotAStringError`: when `role` is not a string.
-   `RoleAlreadyExistsError`: If `role` already exists.
-   `LabelAlreadyInUseError`: If `role` has already been used as label.
-   `MissingRoleError`: If any parent role has not been added yet.

