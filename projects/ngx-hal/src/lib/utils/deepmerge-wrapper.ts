import deepmerge from 'deepmerge';

export function deepmergeWrapper<T = { [K: string]: any }>(...args): T {
	const ensuredArgs = args.map((arg: any) => arg || {});
	return deepmerge.all(ensuredArgs) as unknown as T;
}
