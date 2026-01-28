export function arrayAttr<T>(classType: { new (...args): T }) {
	return class ArrayAttribute {
		constructor(args = []) {
			return args.map((arg) => new classType(arg));
		}
	};
}
