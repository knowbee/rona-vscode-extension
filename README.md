# require-to-import

convert require syntax to ES6 import syntax in the current opened file

`CTRL+ALT+R`

cli tool version of this extension can be found [here](https://www.npmjs.com/package/rona)

## Supported conversions

```js
require("things").name(); // => import { name } from "things"; name();

require("things")(); // => import thingsModule from "things"; thingsModule();

const something = require("example"); // => import something from "example";

const Ben = require("person").name; // => import { name as Ben } from "person";

const { something } = require("things"); // => import { something } from "things";

const { something, anotherThing } = require("things"); // => import { something, anotherThing } from "things";

const something = require("things")(); // => import something from "things";

require("things"); // => import "things";

require("../things"); // => import "../things";

const something = require("things").something(); // => import { something } from "things";

const { thing, thingy: anotherThing } = require("module"); // => import { thing, thingy as anotherThing} from "module"

const {
  thing,
  anotherThing,
  widget: renamedWidget,
  shape: anotherShape,
  color,
} = require("module"); // => import { thing, anotherThing, widget as renamedWidget, shape as anotherShape, color } from "module";
```

## License

MIT

## Author

Igwaneza Bruce

<knowbeeinc@gmail.com>
