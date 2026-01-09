import fs from "node:fs";
import path from "node:path";

export function createPath(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createValidator<const T extends readonly string[]>(values: T) {
  type Value = T[number];
  return {
    values,
    isValid: (value: string): value is Value => {
      return (values as readonly string[]).includes(value);
    },
  };
}
