# require-to-import

convert require syntax to ES6 import syntax in the current opened file

`CTRL+ALT+R`

cli tool version of this extension can be found [here](https://www.npmjs.com/package/rona)

## Preview

<p>
    <img src="https://raw.githubusercontent.com/knowbee/hosting/master/assets/rona_before.PNG" width="400px" height="100" hspace="10"/>
    <img src="https://raw.githubusercontent.com/knowbee/hosting/master/assets/rona_after.PNG" width="400px" height="100" hspace="10"/>
</p>

## Features

```js
const something = require("example"); // => import something from "example";
const Ben = require("person").name; // => import { name as Ben } from "person";
const { something } = require("things"); // => import { something } from "things";
const { something, anotherThing } = require("things"); // => import { something, anotherThing } from "things";
const something = require("things")(); // => import something from "things";
require("things"); // => import "things";
require("../things"); // => import "../things";
const something = require("things").something(); // => import { something } from "things";
```

## License

MIT

## Author

Igwaneza Bruce

<knowbeeinc@gmail.com>
