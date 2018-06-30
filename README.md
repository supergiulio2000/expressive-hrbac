<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [expressive-hrbac](#expressive-hrbac)
- [The problems it solves](#the-problems-it-solves)
- [Installation](#installation)
- [Phylosophy](#phylosophy)
- [Usage](#usage)
  - [Grant access to admin](#grant-access-to-admin)
  - [Associate function to a label for easy reference](#associate-function-to-a-label-for-easy-reference)
  - [Logically combine function](#logically-combine-function)
  - [Roles](#roles)
  - [Role inheritance](#role-inheritance)
- [Methods](#methods)

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

# Installation

# Phylosophy
expressive-hrbac is function-based. You provide synchounous or asynchrounous functions that take the request and response objects as input and return a true boolean when access must be granted or a false boolean when access must be denyed.

expressive-hrbac provide ways to build easy-to-reuse middleware from logical combinations of such functions.

# Usage
## Grant access to admin
First build a function that return true when user is `admin`.
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
If you intend to use such middleware in more than one place, you can associate it to a label useing method `addBoolFunc()`.

```js
hrbac.addBoolFunc('is admin', async (req, res) => req.user.role === 'admin'));

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('is admin'), controller);
router.put('/blogs/:blogId/comments/:commentId', hrbac.middleware('is admin'), controller); 
```
> **NOTE**: function `middleware()` can be passed an synchounous/asynchrounous function or a string label of an added function. This is true for every method that accepts funcitons.

## Logically combine function
If you want to provide access to `admin` or to `user` when he is the owner of the blog post, you first create all the blocks you need and then combine everything in a single function using methods `and()`, `or()`, `not()`,.

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

By so doing expressive-hrbac will automatically create a function that checks for the admin role and associated it to label `admin`.

```js
hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('admin'), controller);
```

> **NOTE**: as soon as you define a role, you can NOT use the role string as a label for other functions.

The role functions can be combined with other funcitons as any function added by you. For example here we provide access to admin or to any user with ID different from 10 (silly example!),.

```js
hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware(hrbac.or('admin', hrbac.not((req, res) => req.user.userId == 10)), controller);
```

By deafult, expressive-hrbac will look into `red.user.role` for the user role. You can change that setting a function that returns the role from the request object.

```js
hrbac.getRoleFunc((req, res) => req.user.myRole);

hrbac.addRole('admin');

router.put('/blogs/:blogId/posts/:postId', hrbac.middleware('admin'), controller);
```
## Role inheritance
A role can inherit access of another role. In other words, if access is not granted for the role, a second check will be attenped for each parent role, and for each parent of each parent and so on.

Inherited parents are declared as a second argument of the `addRole()` method.

Suppose role `superadmin` should be able to access very resource that `admin` can access.

```js
hrbac.addRole('superadmin', 'admin');
```
> **NOTE**: a role must have been added before we can inherit from it

In case `superadmin` should inherit from both `admin` and `blog_admin` acces you pass an array as the second parameter.

```js
hrbac.addRole('superadmin', ['admin', `blog_admin`]);
```
Now when if `superadmin` does not get access, expressive-hrbac will attempt it with role `admin` and role `blog_admin`.

If `blog_admin` further inherited from `user`, then if `superadmin` does not get access, expressive-hrbac will attempt again with role `admin`, role `blog_admin` and `user` traversing the inheritance tree.

```js
hrbac.addRole('user');
hrbac.addRole('blog_admin','user');
hrbac.addRole('admin');
hrbac.addRole('superadmin', ['admin', 'blog_admin']);
```
# Methods

## addGetRoleFunc(func)

## addRole(role, parents = null) {

  addBoolFunc(label, func) {

  or(func1, func2) {

  and(func1, func2) {

  not(func) {

  middleware(func) {
