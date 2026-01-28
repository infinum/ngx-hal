import { HttpResponse } from '@angular/common/http';
import { HalModel } from '../../models/hal.model';
import { Pagination } from '../pagination';
import { HalDocument } from './../hal-document';
import { HalStorage } from './hal-storage';

export class SimpleHalStorage<P extends Pagination> extends HalStorage<P> {
	public save<T extends HalModel<P>>(
		model: T | HalDocument<T, P>,
		response?: HttpResponse<T>,
		alternateUniqueIdentificators: Array<string> = [],
	): void {
		const identificators: Array<string> = [].concat(alternateUniqueIdentificators);
		identificators.push(model.uniqueModelIdentificator);

		identificators.filter(Boolean).forEach((identificator: string) => {
			this.internalStorage[identificator] = model;
		});
	}

	public get<T extends HalModel<P>>(uniqueModelIdentificator: string): T | HalDocument<T, P> {
		return this.internalStorage[uniqueModelIdentificator];
	}
}
