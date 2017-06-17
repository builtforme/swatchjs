# api-methods

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

## Sample usage

Suppose you want to expose a `numbers.add` API which takes 2 parameters (`a` and
`b`) and returns their sum.

```javascript
const apiMethods = require('api-methods');

function add(a, b) {
    return a + b;
}

const api = {
    "numbers.add": {
        handler: add,
        args: {
            a: {
                parse: Number,
            },
            b: {
                parse: Number,
                optional: true,
            },
        },
    },
};

const model = apiMethods.model(api);
```

That's it. You are in business. All that is left is to expose the model, usually
through one of the adapters. It's quick and easy. No need to write unnecessary
code for the application or transport layer. KISS.

## API reference
