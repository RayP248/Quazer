import { Environment } from "./environment";
import { Stmt } from "../ast/ast";
import { BlockStmt, Parameter } from "../ast/statements";

export type ValueType =
  | "number"
  | "string"
  | "boolean"
  | "null"
  | "function"
  | "array"
  | "object"
  | "struct-def"
  | "struct"
  | "class"
  | "native-fn"
  | "error"
  | "void"
  | "any";

export type OverlyingType = "array" | "object";

export interface RuntimeVal {
  type: ValueType;
  returned?: boolean;
}

export interface NullVal extends RuntimeVal {
  type: "null";
  value: null;
}

export function MKNull(): NullVal {
  return { type: "null", value: null } as NullVal;
}

export interface NumberVal extends RuntimeVal {
  type: "number";
  value: number;
}

export function MKNumber(value: number = 0, returned: boolean): NumberVal {
  return { type: "number", value, returned } as NumberVal;
}

export interface StringVal extends RuntimeVal {
  type: "string";
  value: string;
}

export function MKString(value: string, returned: boolean): StringVal {
  return { type: "string", value, returned } as StringVal;
}

export interface BooleanVal extends RuntimeVal {
  type: "boolean";
  value: boolean;
}

export function MKBoolean(value: boolean, returned: boolean): BooleanVal {
  return { type: "boolean", value, returned } as BooleanVal;
}

export interface ObjectVal extends RuntimeVal {
  type: "object";
  properties: Map<string, RuntimeVal>;
}

export function MKObject(returned: boolean): ObjectVal {
  return { type: "object", properties: new Map(), returned } as ObjectVal;
}

export type FnCall = (...args: RuntimeVal[]) => RuntimeVal;

export interface Param {
  name: string;
  type: ValueType;
}

export interface ReturnType {
  type: ValueType;
}

export interface FnVal {
  type: "function";
  name?: string;
  params: Param[];
  decEnv: Environment;
  returnType: ReturnType;
  body: BlockStmt;
}

export interface NativeFnVal {
  type: "native-fn";
  call: FnCall;
}

export function MKNativeFn(call: FnCall, returned: boolean): NativeFnVal {
  return { type: "native-fn", call, returned } as NativeFnVal;
}

export interface ArrayVal extends RuntimeVal {
  type: "array";
  elements: RuntimeVal[];
}

export function MKArray(returned: boolean): ArrayVal {
  return { type: "array", elements: [], returned } as ArrayVal;
}

export interface StructProp {
  name: string;
  type: ValueType;
}

export interface StructDefVal extends RuntimeVal {
  type: "struct";
  properties: Map<string, StructProp>;
  methods: Map<string, FnVal>;
  isStatic: boolean;
}

export interface StructVal extends RuntimeVal {
  structName: string;
  properties: Map<string, RuntimeVal>;
  returned: boolean;
}
