export function arrayAttr<T>(classType: { new(...args): T }) {
  return class ArrayAttribute<T> {
    constructor(args = []) {
      return args.map((arg) => new classType(arg));
    }
  };
}
