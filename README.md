# swatchjs

[![CircleCI](https://circleci.com/gh/builtforme/swatchjs.svg?style=svg)](https://circleci.com/gh/builtforme/swatchjs) |
[![codecov](https://codecov.io/gh/builtforme/swatchjs/branch/master/graph/badge.svg)](https://codecov.io/gh/builtforme/swatchjs) | [![Coverage Status](https://coveralls.io/repos/github/builtforme/swatchjs/badge.svg?branch=master)](https://coveralls.io/github/builtforme/swatchjs?branch=master) | [![Known Vulnerabilities](https://snyk.io/test/github/builtforme/swatchjs/badge.svg)](https://snyk.io/test/github/builtforme/swatchjs)

A framework for easily creating and exposing APIs as methods.

This framework allows your API functions to be written in the same way that any
other function is written: they take parameters, have a return value, and throw
exceptions. They are easy to write and test.

You can write your API independent of a transport layer. You don't have to worry
about status codes, routes, request context, query parameters, or any of that
code that slows you down. It's less code to write and test.

Next, you can choose how to expose your API, using one of pre-existing adapters,
or by writing a new one. These adapters range from simple GET calls over HTTP,
to SOAP, to JSON-RPC, to Protobufs, etc.

## Benefits

* **Your code is simple**<br/>
  Write service API functions the same way you write any other function in the
  language (they take parameters, have a return value, and throw exceptions).
* **Your functions are easy to write and test**<br/>
  You only need to write and test the logical behavior of the function, not the
  transport layer (HTTP headers, status codes, etc.).
* **Faster, better, cheaper**<br/>
  Because you are not checking HTTP headers or query parameters, nor are you
  producing HTTP status codes, response headers, etc., you can write less code,
  which in turn means less bugs. You can also deliver more in less time.
* **DRY (Don't Repeat Yourself)**<br/>
  Because you are only writing core logic in the language, the same functions
  can be reused as needed. They can be used internally as building blocks for
  other functions, they can be exposed as web APIs, or wrapped in CLI tools.

## Sample usage

The following creates a simple API which takes 2 parameters (`a` and `b`) and
returns their sum (`add` method) or difference (`sub` method).

```javascript
const swatch = require('swatchjs');

const model = swatch({
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
});
```

That's it. You are in business. All that is left is to expose the model, usually
through one of the adapters. It's quick and easy. No need to write unnecessary
code for the application or transport layer. KISS.

## API reference

### The `swatch` function

```javascript
const swatch = require('swatchjs');

const model = swatch({
    // api
});
```

Loading this library will result in a function  (`swatch` in the example
above) which when called will produce a model for the API. This model can then
be passed to adapters to expose that API. See
[Exposing the API](#exposing-the-api) below for more details.

### Declaring your API

This function takes an object which describes the API, and it looks like this:

```javascript
{
    "service.api1": myApiFn1,
    "service.api2": myApiFn2,
    // ...
}
```

Each `methodName` is the name for the API you want to expose. The convention is
to group the APIs by functionality area (often by microservices), with camelCase
names separated by dots (e.g.: `users.create`, `users.delete`,
`users.options.add`, `users.options.list`, `users.options.setDefault`).

Each method name is associated with a handler. The handler can be the function
which will handle the API method call, or it can be an object that provides a
little more flexibility in describing the function.

### Declaration-time errors
The following errors will be generated when the API is declared:

| Error             | Description   |
|:---               |:---           |
|`invalid_arg_list` | One or more of the provided method `args` lists did not match the handler function. |


### Declaring API methods (the easy way)

The easiest way to expose an API method is to just associate the method name
with its function. When exposed, each of the parameters in the function will be
arguments in the method.

```javascript
function createUser(username, password, name) {
    // ...
}

const model = swatch({
    "users.create": createUser,
});
```
In the example above, when invoking `users.create`, the user would pass in three
arguments: `username` `password`, and `name`. The framework automatically matches
the arguments passed in by the user to the function arguments.

### Declaring API methods (the more descriptive way)

Alternatively, you can have more control over the behavior of each API method,
as illustrated below:

```javascript
function createUser(username, password, name) {
    // ...
}

function middlewareFn(ctx, next) {
    // ...
}

const model = swatch({
    "users.create": {
        handler: createUser,
        args: [
            {
                name: 'username',
                parse: String,
                optional: false,
            },
            {
                name: 'password',
                parse: String,
                optional: false,
            },
            {
                name: 'name',
                parse: String,
                optional: true,
                default: 'New User',
            },
        ],
        middleware: [middlewareFn],
    },
});
```

In this scenario, when invoking `users.create`, the user would still pass in
three arguments: `username`, `password`, and `name`. The framework automatically
matches the `username` value to the first argument, the `password` value to the
second argument, and `name` value to the third argument of the `createUser`
function. Additionally, the `name` value is optional and will provide a default
value of `'New User'` if the argument is not present.

If the `args` array is present, it must match the function in arity (i.e., the
number of arguments declared in the function must match the number of elements
in the `args` array).

The following properties can be set:

| Property              | Required  | Description
|:---                   |:---       |:---
|`handler`              | Yes       | The API handler. Must be a function.
|`args`                 | No        | Function arguments. Must be an array. See below for more information.
|`middleware`           | No        | An array of functions to run as middleware. Accepts request context and callback function as params. Throw on error to abort request handler.

If the `args` array is present, it must match the function in arity (i.e., the
number of arguments declared in the function must match the number of elements
in the `args` array). Each element in the array can be either a string or an
object.

If an element is an object, then the following properties are valid:

| Property              | Required  | Description
|:---                   |:---       |:---
|`args[idx].name`       | No        | The name of the parameter as passed by caller. Defaults to the name specified in the function.
|`args[idx].parse`      | No        | A function that will be executed on the input. Can be used to perform type coercions. If present, should return desired value, or throw.
|`args[idx].validate`   | No        | A function that will be executed on the successfully parsed/coerced input value. Should not modify or return a value, should throw if invalid.
|`args[idx].optional`   | No        | A boolean indicating whether the argument is optional. Defaults to `false`. If user fails to provide a required arguments, the request will fail.
|`args[idx].default`    | No        | A primitive type or object. If user fails to provide an optional argument, the default will be provided.

If an element is a string "argName", then it is considered equivalent to the
object `{ name: "argName" }`.

## Runtime errors

The following errors will be generated during runtime (when invoking the handler):

| Error             | Description   |
|:---               |:---           |
|`invalid_arg_name` | One or more of the provided arguments was not expected by the handler.    |
|`missing_arg`      | One or more of the required arguments were not provided.                  |


## Exposing the API

The API model created by invoking the `swatch` function can be passed to any
adapter (pre-existing or customized) to expose that API.

For instance, to expose the API using the popular `express` framework, the
`swatchjs-express` adapter (installed separately) can be used as in the
example below. Please consult the documentation for that package for more
details on how to use it.

```javascript
const swatch = require('swatchjs');
const swatchExpress = require('swatchjs-express');

// create model
const model = swatch({
    // api
});

const app = express();
swatchExpress(app, model);
```

## Creating a custom adapter

The `swatch` function returns an array of objects, where each object
contains metadata about the API. The length of the array will be equal to the
number of methods in the API. The order in which each method appears in the
array is not guaranteed to be the same as the order they were declared in the
API object.

Each object will contain the following properties:

| Property              | Description                                                               |
|:---                   |:---                                                                       |
|`name`                 | The name of the method. This is the same as the key in the API object.    |
|`handle`               | A function used to execute the method handler. See [The `handle` function](#the-handle-function) below.   |
|`middleware`           | An array of functions to execute as middleware before the method handler. |

### The `handle` function

The `handle` function is a wrapper around the API handler provided in the API
declaration. It will return and throw whatever that function does. It might
throw its own errors (described above in [Runtime errors](#runtime-errors)).

The `handle` function takes only 1 parameter, which is an object containing the
values for all parameters. As expected it, it validates that all required
arguments are present, and that no unknown argument was passed.

For example:

```javascript
//
// In the user code
//
function findFlight(fromCode, toCode) {
    // ...
}

const model = swatch({
    "flights.find": {
        handler: findFlight,
        args: [
            {
                name: 'fromCode',
                parse: String,
                optional: false
            },
            {
                name: 'toCode',
                parse: String,
                optional: false
            },
        ],
    }
});

yourAdapter(model);
```

```javascript
//
// Inside your adapter
//

// At some point, you will call this:
method.handle({
    fromCode: 'JFK',
    toCode: 'LAX',
});
// And internally, the handle function will then call this:
findFlight('FJK', 'LAX');
```

## Developers

### Coding Style

This project follows the [AirBnB Javascript Coding Guidelines](https://github.com/airbnb/javascript) using [ESLint](http://eslint.org/) settings.
