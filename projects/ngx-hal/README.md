# NgxHal

ngx-hal is a data store with a support for handling [HAL formatted](http://stateless.co/hal_specification.html) HTTP requests.

## Features

- GET single resource
- GET list of resources

## Installation

```bash
npm install --save ngx-hal
```

## Basic usage

After the initial ngx-hal setup (see [Getting started section](https://github.com/infinum/ngx-hal/wiki/Getting-started)) you have to create a resource model which extends `HalModel` from the `ngx-hal` and a resource service which extends `ModelService` from `ngx-hal`.
The following example uses `User` resource as an example.

`user.model.ts`

```js
class User extends HalModel {
  @Attribute()
  public name: string;
}
```

`user.service.ts`

```js
class UserService extends ModelService<User> {
	constructor(datastore: DatastoreService) {
		super(datastore, User);
	}
}
```

And then a few methods are available on an instance of `UserService`:

#### Fetching a user

```js
this.userService.find('1').subscribe((user: User) => {
	console.log('Fetched user', user);
});
```

#### Fetching a list of users

```js
this.userService.find().subscribe((users: Array<User>) => {
	console.log('Fetched users', users);
});
```

#### Fetching a list of users with pagination information

```js
this.userService.find({}, true).subscribe((halDocument: HalDocument<User>) => {
	console.log('Fetched users', halDocument.models);
	console.log('Pagination information', halDocument.pagination);
});
```

## API reference

- [DatastoreService](https://github.com/infinum/ngx-hal/wiki/DatastoreService)
- [HalModel](https://github.com/infinum/ngx-hal/wiki/HalModel)
- [ModelService](https://github.com/infinum/ngx-hal/wiki/ModelService)
- [HalDocument](https://github.com/infinum/ngx-hal/wiki/HalDocument)

## Build

```bash
ng build
```

## Running unit tests

```bash
ng test
```
