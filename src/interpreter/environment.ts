import { Expr, Stmt } from "../ast/ast";
import { Err, ErrorCode } from "../error-handling/error";
import { Token } from "../lexer/tokens";
import { evalCallback, getDisplayValue } from "./helpers";
import { evaluate } from "./interpreter";
import {
  FnVal,
  MKBoolean,
  MKNativeFn,
  MKNull,
  MKObject,
  MKString,
  ObjectVal,
  RuntimeVal,
  ValueType,
} from "./values";
import readline from "readline";

export function createGlobalEnv(rl: readline.Interface): Environment {
  const env = new Environment();
  env.declareVar("true", MKBoolean(true, false), null, "boolean", true);
  env.declareVar("false", MKBoolean(false, false), null, "boolean", true);
  env.declareVar("null", MKNull(), null, "null", true);

  env.declareVar(
    "print",
    MKNativeFn((...args) => {
      args.forEach((arg) => {
        console.log(getDisplayValue(arg));
      });
      return MKNull();
    }, false),
    null,
    "native-fn",
    true
  );

  env.declareVar(
    "println",
    MKNativeFn((...args) => {
      args.forEach((arg) => {
        console.log(getDisplayValue(arg), "\n");
      });
      return MKNull();
    }, false),
    null,
    "native-fn",
    true
  );

  const rl_ = MKObject(false);
  rl_.properties.set(
    "prompt",
    MKNativeFn((input, callback) => {
      let final;
      rl.question(getDisplayValue(input), (answer) => {
        rl.close();
        if (callback)
          final = evalCallback(
            callback as FnVal,
            [MKString(answer, false)],
            env
          );
        else final = MKString(answer, false);
      });
      return final;
    }, false)
  );

  env.declareVar("rl", rl_, null, null, false, true);

  const exec = MKObject(false);
  exec.properties.set(
    "exit",
    MKNativeFn((msg) => {
      console.log(getDisplayValue(msg));
      process.exit(0);
      return MKNull();
    }, false)
  );

  env.declareVar("exec", exec, null, null, false, true);
  return env;
}

export class Environment {
  private parent?: Environment;
  public packageName: string = "";
  private variables: Map<string, RuntimeVal>;
  private types: Map<
    string,
    ValueType | { overlying: ValueType; underlying: ValueType }
  > = new Map();
  private constants: Set<string> = new Set();
  private pubs: Set<string> = new Set();
  public availableImports: Map<string, RuntimeVal> = new Map([
    [
      "rl",
      (() => {
        const obj = MKObject(false);
        obj.properties.set(
          "prompt",
          MKNativeFn((input, callback) => {
            let final;
            rl.question(getDisplayValue(input), (answer) => {
              rl.close();
              if (callback)
                final = evalCallback(
                  callback as FnVal,
                  [MKString(answer, false)],
                  this
                );
              else final = MKString(answer, false);
            });
            return final;
          }, false)
        );

        return obj;
      })(),
    ],
  ]);
  private imported: Map<string, object> = new Map();

  constructor(parent?: Environment, packageName: string = "") {
    this.parent = parent;
    this.variables = new Map();
    this.constants = new Set();
    this.packageName = packageName;
    this.imported = new Map();
    if (parent) {
      this.availableImports = parent.availableImports;
    }
  }

  public declareVar(
    name: string,
    value: any,
    token: Token | Expr | Stmt | null,
    explicitType:
      | ValueType
      | null
      | { overlying: ValueType; underlying: ValueType } = null,
    isPub: boolean = false,
    constant: boolean = false
  ): RuntimeVal {
    if (this.variables.has(name)) {
      new Err(
        token as Token | Expr | Stmt,
        `Variable \`${name}\` is already declared in the current scope.`,
        ErrorCode.CannotReassignConstant,
        "environment.ts : class Environment : declareVar() : if (this.variables.has(name))"
      );
    }
    this.variables.set(name, value);
    if (constant) {
      this.constants.add(name);
    }
    if (isPub) {
      this.pubs.add(name);
    }
    if (explicitType) {
      this.types.set(name, explicitType);
    }
    return value;
  }

  public assignVar(
    name: string,
    value: any,
    token: Token | Expr | Stmt
  ): RuntimeVal {
    const env = this.resolve(name, token);

    if (env.constants.has(name)) {
      new Err(
        token,
        `Cannot reassign a value to constant variable \`${name}\`.`,
        ErrorCode.CannotReassignConstant,
        "environment.ts : class Environment : declareVar() : if (env.constants.has(name))"
      );
    }

    env.variables.set(name, value);
    return value;
  }

  public lookupVar(
    name: string,
    token: Token | Expr | Stmt | null
  ): RuntimeVal {
    const env = this.resolve(name, token);
    const variable = env.variables.get(name) as RuntimeVal;
    if (variable == undefined) {
      new Err(
        token as Token | Expr | Stmt,
        `Variable ${name} is not defined and doesn't exist in the current scope.`,
        ErrorCode.VarDoesNotExist,
        "environment.ts : class Environment : lookupVar() : if (variable == undefined)"
      );
    }
    return variable;
  }

  public resolve(name: string, token: Token | Expr | Stmt | null): Environment {
    if (this.variables.has(name)) {
      return this;
    }
    if (this.parent == undefined) {
      new Err(
        token as Token | Expr | Stmt,
        `Variable ${name} is not defined and doesn't exist in the current scope.`,
        ErrorCode.VarDoesNotExist,
        "environment.ts : class Environment : resolve() : if (this.parent == undefined)"
      );
    } else {
      return this.parent.resolve(name, token);
    }
    return this;
  }
  //TODO: Implement
  /*public import(name: string, token: Token | Expr | Stmt | null): RuntimeVal {
    if (this.imported.has(name)) {
      const importedModule = this.imported.get(name)!;
      if (typeof importedModule === "object" && "type" in importedModule) {
        return importedModule as RuntimeVal;
      }
      new Err(
        token as Token | Expr | Stmt,
        `Imported module ${name} does not conform to RuntimeVal.`,
        ErrorCode.ModuleNotFound,
        "environment.ts : class Environment : import() : if (!this.availableImports.has(name))"
      );
      return MKNull();
    }

    if (this.availableImports.has(name)) {
      const imports = this.availableImports.get(name)!;
      this.imported.set(name, imports);
      for (const [key, val] of (imports as ObjectVal).properties.entries()) {
        this.declareVar(key, val, null, imports.type, false, true);
      }
      return {
        ...imports,
      } as RuntimeVal;
    }

    new Err(
      token as Token | Expr | Stmt,
      `Module ${name} is not available for import.`,
      ErrorCode.ModuleNotFound,
      "environment.ts : class Environment : import() : if (!this.availableImports.has(name))"
    );

    return MKNull();
  }*/
}
