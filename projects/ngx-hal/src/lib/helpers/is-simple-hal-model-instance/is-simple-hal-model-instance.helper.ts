import { SimpleHalModel } from '../../models/simple-hal.model';

export function isSimpleHalModelInstance(classInstance: any): boolean {
	if (!classInstance) {
		return false;
	}

	if (classInstance instanceof SimpleHalModel) {
		return true;
	}

	return isSimpleHalModelInstance(classInstance.prototype);
}
