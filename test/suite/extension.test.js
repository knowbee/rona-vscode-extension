const assert = require("assert");
const fs = require("fs");
const tmp = require("tmp");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
// const myExtension = require('../extension');

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Test One Line Require Whole Module", async () => {
    await assert_converted_text_is(
      `const something = require("example");`,
      `import something from "example";`
    );
  });

  test("Test One Line Require Module Then Property", async () => {
    await assert_converted_text_is(
      `const Ben = require("person").name;`,
      `import { name as Ben } from "person";`
    );
  });

  test("Test One Line Require Named", async () => {
    await assert_converted_text_is(
      `const { something } = require("things");`,
      `import { something } from "things";`
    );
  });

  test("Test One Line Require Several Named", async () => {
    await assert_converted_text_is(
      `const { something, anotherThing } = require("things");`,
      `import { something, anotherThing } from "things";`
    );
  });

  test("Test One Line Require Module Executed", async () => {
    await assert_converted_text_is(
      `const something = require("things")();`,
      `import something from "things";`
    );
  });

  test("Test One Line Only Require", async () => {
    await assert_converted_text_is(
      `require("../things");`,
      `import "../things";`
    );
  });

  test("Test One Line Require Module Then Property Executed", async () => {
    await assert_converted_text_is(
      `const something = require("things").something();`,
      `import { something } from "things";`
    );
  });

  test("Test One Line Require Aliased Names", async () => {
    await assert_converted_text_is(
      `const { thing, thingy: anotherThing } = require("module");`,
      `import { thing, thingy as anotherThing } from "module";`
    );
  });

  test("Test Multiple Line Require Several Aliased Names Then Non-require Statements", async () => {
    await assert_converted_text_is(
      `const {
        thing,
        anotherThing,
        widget: renamedWidget,
        shape: anotherShape,
        color,
      } = require("module");

      function execute() {
        return {
          color: "green",
        };
      }`,
      `import { thing, anotherThing, widget as renamedWidget, shape as anotherShape, color } from "module";

      function execute() {
        return {
          color: "green",
        };
      }`
    );
  });

  test("Test Multiple Line Require Several Named", async () => {
    await assert_converted_text_is(
      `const {
        thing,
        anotherThing,
        widget,
        shape,
        color,
      } = require("module");`,
      `import { thing, anotherThing, widget, shape, color } from "module";`
    );
  });

  test("Test Several Require Statements Then Non-require Statements", async () => {
    await assert_converted_text_is(
      // some of these are intentionally missing semicolons
      `
      const something = require("example");
      const Ben = require("person").name
      const { something } = require("things");
      const {
        thing,
        anotherThing,
        widget,
        shape: anotherShape,
        color,
      } = require("module")
      const { something, anotherThing } = require("things");

      function execute() {
        return {
          color: "green",
        };
      }`,
      `
import something from "example";
import { name as Ben } from "person";
import { something } from "things";
import { thing, anotherThing, widget, shape as anotherShape, color } from "module";
import { something, anotherThing } from "things";

      function execute() {
        return {
          color: "green",
        };
      }`
    );
  });
});

/**
 * @param {string} original_text
 * @param {string} expected_text
 */
async function assert_converted_text_is(original_text, expected_text) {
  await load_text_editor_with_text(original_text);
  await vscode_execute_command("extension.Rona");
  const editor_text = vscode.window.activeTextEditor.document.getText();
  assert.equal(editor_text, expected_text);
}

/**
 * Execute a vscode command then wait a bit for it to be run.
 *
 * This seems to be required for changes to show up, rather than checking
 * things immediately after executeCommand().
 * @param {string} command
 */
async function vscode_execute_command(command) {
  await vscode.commands.executeCommand(command);
  await delay(600);
}

/**
 * @param {string} text
 */
async function load_text_editor_with_text(text) {
  const tmp_file = tmp.fileSync();
  fs.writeSync(tmp_file.fd, text, 0, "utf-8");
  const document = await vscode.workspace.openTextDocument(tmp_file.name);
  await vscode.window.showTextDocument(document);
}

/**
 * @param {number} ms
 */
async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
