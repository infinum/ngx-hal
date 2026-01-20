import { isHalModelInstance } from '../is-hal-model-instance.ts/is-hal-model-instance.helper';

export function isFunction(functionToCheck: any): boolean {
	return typeof functionToCheck === 'function' && !isHalModelInstance(functionToCheck);
}
