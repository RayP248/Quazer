import { Parameter } from "../ast/statements";
import { Err, ErrorCode } from "../error-handling/error";
import { Environment } from "./environment";
import { evaluate } from "./interpreter";
import {
  ArrayVal,
  BooleanVal,
  FnVal,
  MKNull,
  NativeFnVal,
  NullVal,
  NumberVal,
  Param,
  RuntimeVal,
  StringVal,
  ValueType,
} from "./values";

export function getDisplayValue(value: RuntimeVal): any {
  switch (value.type) {
    case "number":
      return (value as NumberVal).value;
    case "string":
      return (value as StringVal).value.replace(/^"/, "").replace(/"$/, "");
    case "boolean":
      return (value as BooleanVal).value;
    case "null":
      return (value as NullVal).value;
    case "array":
      const arr: any[] = [];
      for (const val of (value as ArrayVal).elements) {
        arr.push(getDisplayValue(val as RuntimeVal));
      }
      return arr;
    default:
      new Err(
        null,
        `Cannot display value of type ${value.type} because it is not implemented.`,
        ErrorCode.NotImplemented,
        "helpers.ts : getDisplayValue()"
      ).throw();
      return "";
  }
}

export function evalCallback(
  callback: RuntimeVal,
  args: RuntimeVal[],
  env: Environment
): RuntimeVal {
  if (callback.type === "native-fn") {
    return (callback as NativeFnVal).call(...args);
  } else if (callback.type === "function") {
    const fn = callback as FnVal;
    const scope = new Environment(env);
    for (let i = 0; i < fn.params.length; i++) {
      scope.declareVar(
        fn.params[i].name,
        args[i],
        null,
        fn.params[i].type,
        false
      );
    }
    let final: RuntimeVal;
    final = evaluate(fn.body, scope);
    if (final.returned) return final;
    else return MKNull();
  } else {
    new Err(
      null,
      `Invalid callback type: ${callback.type}.`,
      ErrorCode.InvalidCallbackType,
      "helpers.ts : evalCallback()"
    ).throw();
    return MKNull();
  }
}
