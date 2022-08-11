import { isHalModelInstance } from '../is-hal-model-instance.ts/is-hal-model-instance.helper';
import { isSimpleHalModelInstance } from '../is-simple-hal-model-instance.ts/is-simple-hal-model-instance.helper';

export function isFunction(functionToCheck) {
  return typeof functionToCheck === 'function' &&
    !isHalModelInstance(functionToCheck) &&
    !isSimpleHalModelInstance(functionToCheck);
}
