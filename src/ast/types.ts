import { ValueType } from "../interpreter/values";
import { Type } from "./ast";

export interface SymbolType extends Type {
  line: Record<string, number>;
  column: Record<string, number>;
  _type?(): () => {};
}

export interface ArrayType extends Type {
  line: Record<string, number>;
  column: Record<string, number>;
  _type?(): () => {};
}
