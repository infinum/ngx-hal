import { isHalModelInstance } from '../is-hal-model-instance/is-hal-model-instance.helper';
import { isSimpleHalModelInstance } from '../is-simple-hal-model-instance/is-simple-hal-model-instance.helper';

export function isFunction(functionToCheck: unknown): boolean {
	return (
		typeof functionToCheck === 'function' &&
		!isHalModelInstance(functionToCheck) &&
		!isSimpleHalModelInstance(functionToCheck)
	);
}
