# swatchjs

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

This function may also take a second `options` object to help with configuration.
Currently this parameter supports the following fields:

| Property         | Description          | Default Behavior                |
|:---              |:---                  |:---                             |
|`argNameMapFn`    | Function - Map args from JSON schema to handler fn  | Maps snake_case to camelCase      |

### Handling each API method (the easy way)

The easiest way to expose an API method is to just associate the method name
with its function. When exposed, each of the parameters in the function will be
arguments in the method.

```javascript
function createUser(username, password) {
    // ...
}

const model = swatch({
    "users.create": createUser,
});
```
In the example above, when invoking `users.create`, the user would pass in two
arguments: `username` and `password`. The framework automatically matches the
arguments passed in by the user to the function arguments.

### Handling each API method (the more descriptive way)

You can also optionally pass in an object, describing each argument separately:

```javascript
function createUser(username, password) {
    // ...
}

const model = swatch({
    "users.create": {
        handler: createUser,
        args: {
            username: {
                parse: String,
                optional: false,
            },
            password: {
                parse: String,
                optional: false,
            },
        },
    },
});
```

The following properties can be set:

| Property              | Required  | Description                                       |
|:---                   |:---       |:---                                               |
|`handler`              | Yes       | The API handler. Must be a function.              |
|`args`                 | No        | Arguments information.                            |
|`args[key]`            | Yes       | The parameter name. Must exist in the handler.    |
|`args[key].parse`      | No        | A function that will be executed on the input. Can be used to perform type coercions. If present, should return desired value, or throw.    |
|`args[key].validate`   | No        | A function that will be executed on the successfully parsed/coerced input value. If present, should return desired value, or throw.    |
|`args[key].optional`   | No        | A boolean indicating whether the argument is optional. Defaults to `false`. If user fails to provide a required arguments, the request will fail.         |

## Runtime errors

The following errors will be generated during runtime (when invoking the
handler):

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

### The `handle` function

The `handle` function is a wrapper around the API handler provided in the API
declaration. It will return and throw whatever that function does. It might
throw its own errors (described above in [Runtime errors](#runtime-errors)).

The `handle` function takes only 1 parameter, which is an object containing the
values for all parameters. As expected it, it validates that all required
arguments are present, and that no unknown argument was passed.

Note that by default, args defined in the API schema should be `snake_case`, 
while the matching args in the handler function should be `camelCase`. See above
for how to override this default mapping behavior with `options.argNameMapFn`.

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
        args: {
            from_code: {
                parse: String,
                optional: false
            },
            to_code: {
                parse: String,
                optional: false
            }
        }
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
