import { HalModel } from '../../models/hal.model';

export function isHalModelInstance(classInstance: any): boolean {
  if (!classInstance) {
    return false;
  }

  if (classInstance instanceof HalModel) {
    return true;
  }

  return isHalModelInstance(classInstance.prototype);
}
