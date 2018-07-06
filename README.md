<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [expressive-hrbac](#expressive-hrbac)
- [The problems it solves](#the-problems-it-solves)
- [Installation](#installation)
- [Phylosophy](#phylosophy)
- [Usage](#usage)
  - [Grant access to role](#grant-access-to-role)
  - [Associate function to a label for easy reference](#associate-function-to-a-label-for-easy-reference)
  - [Logically combine function](#logically-combine-function)
  - [Roles](#roles)
  - [Role inheritance](#role-inheritance)
- [Methods](#methods)
  - [addRole(role, parents = null)](#addrolerole-parents--null)
  - [addGetRoleFunc(func)](#addgetrolefuncfunc)
  - [addBoolFunc(label, func)](#addboolfunclabel-func)
  - [or(func1, func2)](#orfunc1-func2)
  - [and(func1, func2)](#andfunc1-func2)
  - [not(func)](#notfunc)
  - [middleware(func)](#middlewarefunc)
  - [getInstance(label = null)](#getinstancelabel--null)
- [Utilities](#utilities)
  - [Generate README.md table of contents](#generate-readmemd-table-of-contents)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# expressive-hrbac
Expressjs middleware builder to easily produce arbitrary Hierarchical Role-Based Access Control middleware with resource granularity.

# The problems it solves
* Provide access to a given resource only when the user has been awarded a certain role.

   Example: admin can edit any blog posts.

* Provide access to a given resource only when a user has a particular right on the resource

   Example: user can edit his own blog posts but not the posts from other users

* Provide a way of combining logically any condition on roles or resouces access

   Example: a blog post can be edited by admin or by user when he is the blog owner.

And much more...

# Installation

# Phylosophy
**expressive-hrbac** is function-based. You provide synchounous or asynchrounous functions that take the request and response objects as input and return a true boolean when access must be granted or a false boolean when access must be denyed.

**expressive-hrbac** provide ways to build easy-to-reuse middleware from logical combinations of such functions.

# Usage
## Grant access to role
First build a function that return true when user has role `admin`.
```js
(req, res) => req.user.role ==== 'admin'
```

A middleware can be created from such function using method `middleware()`.

```js
const router = require('express').Router();

const hrbac = require('expressive-hrbac');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware((req, res) => req.user.role === 'admin'), controller); 
```

Maybe you prefer asynchronous functions:

```js
router.put('/blogs/:blogId/posts/:postId', hrbac.middleware(async (req, res) => req.user.role === 'admin'), controller); 
```

## Associate function to a label for easy reference
If you intend to use a function in more than one middleware you can avoid repeating it. You can associate it to a label using method `addBoolFunc()`.

```js
hrbac.addBoolFunc('is admin', async (req, res) => req.user.role === 'admin'));

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('is admin'), controller);
router.put('/blogs/:blogId/comments/:commentId', hrbac.middleware('is admin'), controller); 
```

**NOTE**: function `middleware()` can be passed an synchounous/asynchrounous function or a string label of an associated function. This is true for every method that accepts funcitons.

## Logically combine function
If you want to provide access to role `admin` or to role `user` only when `user` the owner of the blog post, you first create all the blocks you need and then combine everything in a single function using methods `and()`, `or()`, `not()`.

```js
hrbac.addBoolFunc('is admin', (req, res) => req.user.role = 'admin'));
hrbac.addBoolFunc('is user', (req, res) => req.user.role = 'user'));
hrbac.addBoolFunc('is post owner', async (req, res) => await Posts.findById(req.params.postId).ownerId === req.user.id ));

hrbac.addBoolFunc('is admin or post owner user', hrbac.or('is admin', hrbac.and('is user', 'is post owner')));

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('is admin or post owner user'), controller); 
```

## Roles
So far we have used roles improperly. You should not provide functions checking for roles but use the `addRole()` method instead.

```js
hrbac.addRole('admin');
```

By so doing expressive-hrbac will automatically create a function that checks for the `admin` role and associated it to label `admin`.

```js
hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('admin'), controller);
```

> **NOTE**: as soon as you define a role, you can NOT use the role string as a label for other functions.

The role functions can be combined with other funcitons as any other function. For example here we provide access to admin or to any user with ID different from 10 (silly example!),.

```js
hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware(hrbac.or('admin', hrbac.not((req, res) => req.user.userId == 10)), controller);
```

By deafult, expressive-hrbac will look into `red.user.role` for the user role. You can change that behaviour setting a function that returns the role from the request object.

```js
hrbac.getRoleFunc((req, res) => req.user.myRole);

hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('admin'), controller);
```
## Role inheritance
A role can inherit access of another role. If access is not granted for the role, a second check will be attenped for each parent role, and for each parent role of each parent role and so on.

Inherited parents are declared as a second argument of the `addRole()` method.

Suppose role `superadmin` should be able to access every resource that `admin` can access.

```js
hrbac.addRole('superadmin', 'admin');
```
> **NOTE**: a role must have been added before we can inherit from it

In case `superadmin` should inherit from both `admin` and `blog_admin` acces you pass an array as the second parameter.

```js
hrbac.addRole('superadmin', ['admin', `blog_admin`]);
```
Now when `superadmin` does not get access, expressive-hrbac will try again with role `admin` and in case of failure with role `blog_admin`.

If `blog_admin` further inherited from `user`, then if `superadmin` does not get access, expressive-hrbac will try again again with role `admin`, role `blog_admin` and role `user` traversing the inheritance tree.

```js
hrbac.addRole('user');
hrbac.addRole('blog_admin','user');
hrbac.addRole('admin');
hrbac.addRole('superadmin', ['admin', 'blog_admin']);
```
# Methods

## addRole(role, parents = null)
Adds a role to the HRBAC instance

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
-   `LabelAlreadyInUseError`: If `role` has already been used as label.
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
-    `ParameterNumberMismatchError`: when `func` does not take exactly 2 arguments.


## addBoolFunc(label, func)
Adds a boolean function and associates it to the provided label

**Parameters**:
-   `label`: [**string**] - The label to associate the function to
-   `func`: [**sync/async function**] - Function to be called

**Returns**:
-   [**HRBAC**] current HRBAC instance.

**Throws**:
-   `UndefinedParameterError`: When `label` or `func` is undefined.
-   `NullParameterError`: When `label` or `func` is null.
-   `EmptyParameterError`: When `label` is empty string.
-   `NotAStringError`: when `label` is not a string.
-   `NotAFunctionError`: when `func` is not a sync/async function.
-   `LabelAlreadyInUseError`: If `label` has already been used as label.
-    `ParameterNumberMismatchError`: when `func` does not take exactly 2 arguments.

## or(func1, func2)
Combines two function with boolean OR

**Parameters**:
-   `func1`: [**string | sync/async function**] - Label or actual function
-   `func2`: [**string | sync/async function**] - Label or actual function

**Returns**:
-   [**sync/async function**] - Combined function

**Throws**:
-   `UndefinedParameterError`: When `func1` or `func2` is undefined.
-   `NullParameterError`: When `func1` or `func2` is null.
-   `EmptyParameterError`: When `func1` or `func2` is a string which is empty.
-   `MissingFunctionError`: If `func1` or `func2` is a string but it is not associated to a function
-   `NotAFunctionError`: when `func1` or `func2` is not a string and it is not a sync/async function.
-    `ParameterNumberMismatchError`: when `func1` or `func2` is not a string and it is not a function which takes exactly 2 arguments.

## and(func1, func2)
Combines two function with boolean AND

**Parameters**:
-   `func1`: [**string | sync/async function**] - Label or actual function
-   `func2`: [**string | sync/async function**] - Label or actual function

**Returns**:
-   [**sync/async function**] - Combined function

**Throws**:
-   `UndefinedParameterError`: When `func1` or `func2` is undefined.
-   `NullParameterError`: When `func1` or `func2` is null.
-   `EmptyParameterError`: When `func1` or `func2` is a string which is empty.
-   `MissingFunctionError`: If `func1` or `func2` is a string but it is not associated to a function
-   `NotAFunctionError`: when `func1` or `func2` is not a string and it is not a sync/async function.
-    `ParameterNumberMismatchError`: when `func1` or `func2` is not a string and it is not a function which takes exactly 2 arguments.

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
-    `ParameterNumberMismatchError`: when `func` is not a string and it is not a function which takes exactly 2 arguments.

## middleware(func)
Returnes middleware function.

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
-    `ParameterNumberMismatchError`: when `func` is not a string and it is not a function which takes exactly 2 arguments.

## getInstance(label = null)
Retruns, and create if necessary, an HRBAC instance associated to `label`. If `label` is not provided will return, and create if necessary, an HRBAC instance associated to the empty string.

**Parameters**:
-   `label`: (_optional_) [**string**] - label to associate the instance to. If not provided will associate instance to empty string.

**Returns**:
-   [**HRBAC**] HRBAC instance associated to `label` is provided or the empty string.

**Throws**:
-   `NullParameterError`: When `role` is null.
-   `EmptyParameterError`: When `role` is empty string.
-   `NotAStringError`: when `role` is not a string.
-   `RoleAlreadyExistsError`: If `role` already exists.
-   `LabelAlreadyInUseError`: If `role` has already been used as label.
-   `MissingRoleError`: If any parent role has not been added yet.

# Utilities
## Generate README.md table of contents

Install doctoc from npm the add ToC to markdown file.

```bash
doctoc README.md
```
