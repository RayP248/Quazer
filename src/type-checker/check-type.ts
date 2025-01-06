import { RuntimeVal, ValueType } from "../interpreter/values";

export function checkType(
  val1: RuntimeVal,
  val2: RuntimeVal,
  desiredType: ValueType,
  origin: string
): boolean {
  return desiredType
    ? val1.type == desiredType && val2.type == desiredType
    : val1.type === val2.type;
}
