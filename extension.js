// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
let editor = vscode.window.activeTextEditor;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.Rona",
    function() {
      const re_normal = /^(const|let|var)\s+(\w+)\s+=(\s*require\((.+?))\)(;|)$/gim; // const name = require("name");
      const re_unique = /^(const|let|var)\s+(\w+)\s+=\s+require\((.+?)\).(\w+)(;|)$/gim; // const Bob = require("name").first
      const re_special = /^(const|let|var)\s+\{\s*(\w+.+)\s*}\s+=\s+require\((.+?)\)(;|)$/gim; // const { name } = require("name")
      const re_direct = /^require\((.+?)\)(;|)$/gim; // require("things")
      const re_invoked = /^(const|let|var)\s*(\w+)\s*=(\s*require\((.+?))\)\(\)(;|)$/gim; // const name = require("person")()
      const re_unique_invoked = /^(const|let|var)\s+(\w+)\s+=\s+require\((.+?)\).(\w+)\(\)(;|)$/gim; // const something = require("things").something()
      fs.writeFileSync(
        editor.document.uri.fsPath,
        fs
          .readFileSync(editor.document.uri.fsPath, "utf-8")
          .replace(re_normal, `import $2 from $4`)
          .replace(re_normal, `import $2 from $4`)
          .replace(re_direct, `import $1`)
          .replace(re_unique, `import { $4 as $2 } from $3`)
          .replace(re_invoked, `import $2 from $4`)
          .replace(re_unique_invoked, `import { $4 } from $3`)
          .replace(re_special, `import { $2 } from $3`)
      );
      vscode.window.showInformationMessage(
        "file has been converted successfully"
      );
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
