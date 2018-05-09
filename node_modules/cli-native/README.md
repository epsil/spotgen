# Native

Utility functions for converting strings to native types and vice versa.

## Install

```
npm install cli-native
```

## Test

```
npm test
```

## API

```javascript
var native = require('cli-native');
native.to('1,2,3', ',');                    // => [1, 2, 3]
native.to('true');                          // => true
native.to('false');                         // => false
native.to('null');                          // => null
native.to('undefined');                     // => undefined
native.to('value');                         // => 'value'
native.to('{"arr":[1,2,3]}', null, true);   // => {arr: [1, 2 ,3]}
```

### to(str, [delimiter], [json])

Convert a string to a native type.

* `str`: The string to convert.
* `delimiter`: A delimiter to use to convert to arrays.
* `json`: A boolean indicating that strings that appear to be JSON should be parsed.

### from(val, [delimiter], [json])

Convert a native type to a string.

* `val`: The value to convert to a string.
* `delimiter`: A delimiter to used to join arrays.
* `json`: A boolean indicating that complex objects should be serialized to JSON.

## License

Everything is [MIT](http://en.wikipedia.org/wiki/MIT_License). Read the [license](/LICENSE) if you feel inclined.
