import fs from "fs";
import { tokenize } from "./lexer/lexer";
import { parse } from "./parser/parser";
import * as util from "util";
import { createGlobalEnv } from "./interpreter/environment";
import { evaluate } from "./interpreter/interpreter";
import readline from "readline";

export let file = "./examples/08.lang";
export let src = fs.readFileSync(file, "utf8");

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Would you like to run the REPL? (y/n): ", async (answer) => {
    if (answer === "y") {
      rl.close();
      repl();
    } else {
      const tokens = tokenize(src);
      const ast = parse(tokens);
      console.log(
        /*JSON.stringify(ast));*/ util.inspect(ast, false, null, true)
      );
      const env = createGlobalEnv(rl);
      const output = await evaluate(ast, env);
      //console.log(util.inspect(output, false, null, true));
      //console.log(util.inspect(tokens, false, null, true));
    }
  });
}

function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">> ",
  });
  const env = createGlobalEnv(rl);
  console.log("REPL v0.0.1");
  rl.prompt();
  rl.on("line", (line) => {
    if (line === "clear") {
      console.clear();
      console.log("REPL v0.0.1");
      rl.prompt();
      return;
    }
    const tokens = tokenize(line);
    const ast = parse(tokens);
    console.log("AST: ", util.inspect(ast, false, null, true));
    const output = evaluate(ast, env);
    file = line;
    src += "\n" + line;
    //console.log(
    //  "Interpreted Output: ",
    //  util.inspect(output, false, null, true)
    //);
    rl.prompt();
  }).on("close", () => {
    process.exit(0);
  });
}

main();
