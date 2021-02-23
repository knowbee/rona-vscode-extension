// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.Rona",
    function () {
      const editor = vscode.window.activeTextEditor;
      const re_general = /^[ \t]*(?<what_to_import_full>(?:const|let|var)\s+(?<what_to_import>{?[\s\w,:]+}?)\s*=)?\s*require\s*\(\s*['"](?<module>.*?)['"]\s*\)(?:\.(?<module_property_access>\w+)?)?(?<call_of_module_or_property>\(\))?[ \t]*;?(?:[ \t]*|(?<trailing_comment>[ \t]*(?:\/\/.*|\/\*.*\*\/[ \t]*)))$/gim;
      const orig_text = fs.readFileSync(editor.document.uri.fsPath, "utf-8");
      const converted_text = orig_text.replace(
        re_general,
        (match, p1, p2, p3, p4, p5, p6, offset, string, groups) => {
          const {
            what_to_import,
            module,
            module_property_access,
            call_of_module_or_property,
            trailing_comment,
          } = groups;
          const what_to_import_obj = parse_what_to_import(what_to_import);
          if (what_to_import_obj === null) {
            return match;
          }
          /**
           * @type {string|null}
           */
          let converted_js_text = (() => {
            //
            if (what_to_import_obj.type === "empty") {
              if (module_property_access && !call_of_module_or_property) {
                /**
                 * require("things").name
                 *   => ?
                 *
                 * Unclear how to represent this as an es6 import. The .name
                 * access doesn't do anything, and may suggest a user
                 * mistake.
                 */
                return null;
              } else if (module_property_access && call_of_module_or_property) {
                /**
                 * require("things").name()
                 *   => import { name } from "things";
                 *      name();
                 */
                return `import { ${module_property_access} } from "${module}";${os.EOL}${module_property_access}();`;
              } else if (
                !module_property_access &&
                call_of_module_or_property
              ) {
                try {
                  /**
                   * require("things")()
                   *   => import thingsModule from "things";
                   *      thingsModule();
                   */
                  const module_turned_to_var_name = convert_to_js_var_name(
                    module
                  );
                  return `import ${module_turned_to_var_name} from "${module}";${os.EOL}${module_turned_to_var_name}();`;
                } catch (err) {
                  /**
                   * Then the module reference is not representable as a var
                   * name.
                   */
                  return null;
                }
              } else if (
                !module_property_access &&
                !call_of_module_or_property
              ) {
                /**
                 * require("things");
                 *   => import "things";
                 */
                return `import "${module}";`;
              }
            } else if (what_to_import_obj.type === "scalar") {
              if (!module_property_access && !call_of_module_or_property) {
                /**
                 * const something = require("example");
                 *   => import something from "example";
                 */
                return `import ${what_to_import_obj.import_module_as} from "${module}";`;
              } else if (
                module_property_access &&
                !call_of_module_or_property
              ) {
                /**
                 * const Ben = require("person").name;
                 *   => import { name as Ben } from "person";
                 */
                return `import { ${module_property_access} as ${what_to_import_obj.import_module_as} } from "${module}";`;
              } else if (
                !module_property_access &&
                call_of_module_or_property
              ) {
                /**
                 * const something = require("things")();
                 *   => import something from "things";
                 */
                return `import ${what_to_import_obj.import_module_as} from "${module}";`;
              } else if (module_property_access && call_of_module_or_property) {
                /**
                 * const something = require("things").something();
                 *   => import { something } from "things";
                 */
                return `import { ${what_to_import_obj.import_module_as} } from "${module}";`;
              }
            } else if (what_to_import_obj.type === "names") {
              /**
               * handles all named imports like:
               *
               * const { something } = require("things");
               *   => import { something } from "things";
               *
               * const { something, anotherThing } = require("things");
               *   => import { something, anotherThing } from "things";
               *
               * const { thing, thingy: anotherThing } = require("module");
               *   => import { thing, thingy as anotherThing} from "module"
               *
               * const {
               *   thing,
               *   anotherThing,
               *   widget: renamedWidget,
               *   shape: anotherShape,
               *   color,
               * } = require("module");
               *   => import { thing, anotherThing, widget as renamedWidget, shape as anotherShape, color } from "module";
               */
              const import_names_str = Object.keys(what_to_import_obj.names)
                .map((name) => {
                  const alias = what_to_import_obj.names[name];
                  return name + (alias ? ` as ${alias}` : "");
                })
                .join(", ");
              return `import { ${import_names_str} } from "${module}";`;
            }
            return null;
          })();
          if (converted_js_text === null) {
            return match;
          }
          return trailing_comment
            ? converted_js_text + trailing_comment
            : converted_js_text;
        }
      );
      fs.writeFileSync(editor.document.uri.fsPath, converted_text, "utf-8");
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

/**
 * @param {string} what_to_import
 * @returns {{"type": "empty"}|{"type": "scalar", import_module_as: string }|{"type": "names", names: Record<string, string|null>}|null}
 *
 * Returns null if the string doesn't look like valid js, otherwise a parsed
 * form of it.
 *
 * Examples:
 *
 * when what_to_import is:
 *   "" i.e. from `require("module");`
 *     then we return: { "type": "empty" }
 *
 * when what_to_import is:
 *   "thing" i.e. from `const thing = require("module");`
 *     then we return: { "type": "scalar", importModuleAs: "thing" }
 *
 * when what_to_import is:
 *   "{ widget, color: renameColor, size }" i.e. from `const { widget, color: renameColor, size } = require("module");
 *     then we return: { "type": "names", names: { widget: null, color: "renameColor", size: null }}
 */
function parse_what_to_import(what_to_import) {
  if (!what_to_import || /^\s*$/.test(what_to_import)) {
    return { type: "empty" };
  }
  let re_begin_curly = /^\s*{/i;
  let re_end_curly = /}\s*$/i;
  let curly_braces_found = false;
  if (
    re_begin_curly.test(what_to_import) &&
    re_end_curly.test(what_to_import)
  ) {
    curly_braces_found = true;
    what_to_import = what_to_import
      .replace(re_begin_curly, "")
      .replace(re_end_curly, "");
  }
  if (/[{}]/.test(what_to_import)) {
    /**
     * Braces should only be around the outsides, and we've already removed
     * those.
     */
    return null;
  }
  if (curly_braces_found) {
    try {
      what_to_import = what_to_import.replace(/\s+/g, "");
      /**
       * Parse something like: `widget, color: renameColor, size`
       *   into an actual js obj like:
       *   { widget: null, color: "renameColor", size: null }
       */
      return {
        type: "names",
        names: what_to_import
          .split(/,/g)
          .map((tok) => {
            if (/^\s*$/.test(tok)) {
              return null;
            }
            const nameAndAlias = tok.split(/:/g);
            if (nameAndAlias.length > 2) {
              throw new Error(`more than one ':'`);
            }
            const name = nameAndAlias[0],
              alias = nameAndAlias.length === 2 ? nameAndAlias[1] : null;
            return {
              [name]: alias,
            };
          })
          .reduce((accumulator, current_value) => {
            if (current_value) {
              return {
                ...accumulator,
                ...current_value,
              };
            } else {
              return accumulator;
            }
          }, {}),
      };
    } catch (err) {
      return null;
    }
  } else {
    what_to_import = trim_edges(what_to_import);
    if (/\W/.test(what_to_import)) {
      /**
       * if so, then string is invalid because it's e.g. like this:
       *   const one two = require("module");
       */
      return null;
    }
    return {
      type: "scalar",
      import_module_as: what_to_import,
    };
  }
}

/**
 * Removes beginning and ending whitespace from string
 * @param {string} str
 */
function trim_edges(str) {
  return str.replace(/^\s+/, "").replace(/\s+$/, "");
}

/**
 * @param {string} module_reference
 */
function convert_to_js_var_name(module_reference) {
  const module_reference_components = module_reference
    .replace(/\\/g, "/")
    .split(/\//g);
  module_reference_components.reverse();
  const word_like_component = module_reference_components.find(
    (component) => !/^\s*$/.test(component)
  );
  if (typeof word_like_component === "undefined") {
    throw new Error(
      `could not find any components of the module reference suitable for a variable name`
    );
  }
  return convert_to_camel_case(word_like_component) + "Module";
}

/**
 * @param {string} str
 */
function convert_to_camel_case(str) {
  str = str
    .replace(/[^\w\$\-\.]+/g, "")
    .replace(/\-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/\.(ts|js|jsx|mjs|cjs)$/, "")
    .replace(/\.+/g, "");
  const char_array = [...str];
  let output_char_array = [];
  while (char_array.length > 0) {
    const char = char_array.shift();
    if (char === "-") {
      /**
       * capitalize next letter because we are changing e.g.
       *   "my-module-name" -> "myModuleName".
       */
      const next_char = char_array.shift();
      if (typeof next_char !== "undefined") {
        output_char_array.push(next_char.toUpperCase());
      }
    } else {
      output_char_array.push(char);
    }
  }
  const output_str = output_char_array.join("");
  return output_str;
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
