import { Type } from "./ast";

export interface SymbolType extends Type {
  name: string;
  line: Record<string, number>;
  column: Record<string, number>;
  _type?(): () => {};
}

export interface ArrayType extends Type {
  underlying: Type;
  line: Record<string, number>;
  column: Record<string, number>;
  _type?(): () => {};
}
