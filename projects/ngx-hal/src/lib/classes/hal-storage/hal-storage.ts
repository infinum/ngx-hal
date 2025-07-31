import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HalModel } from '../../models/hal.model';
import { ModelConstructor, ModelConstructorFn } from '../../types/model-constructor.type';
import { RequestOptions } from '../../types/request-options.type';
import { Pagination } from '../pagination';
import { HalDocument } from './../hal-document';

export abstract class HalStorage<P extends Pagination> {
	protected internalStorage: { [K: string]: any } = {};

	public abstract save<T extends HalModel<P>>(
		model: T | HalDocument<T, P>,
		response?: HttpResponse<T>,
		alternateUniqueIdentificators?: Array<string>,
	): void;

	public abstract get<T extends HalModel<P>>(
		uniqueModelIdentificator: string,
	): T | HalDocument<T, P>;

	public saveAll<T extends HalModel<P>>(
		models: Array<T>,
		savePartialModels: boolean = false,
	): void {
		models.forEach((model: T) => {
			if (savePartialModels || !this.get(model.uniqueModelIdentificator)) {
				this.save(model);
			}
		});
	}

	public remove(model: HalModel<P>): void {
		delete this.internalStorage[model.uniqueModelIdentificator];
	}

	public enrichRequestOptions(
		uniqueModelIdentificator: string,
		requestOptions: RequestOptions,
	): void {
		// noop
	}

	public makeGetRequestWrapper?<T extends HalModel<P>>(
		urls: { originalUrl: string; cleanUrl: string; urlWithParams: string },
		cachedResource: T | HalDocument<T, P>,
		originalGetRequest$: Observable<T | HalDocument<T, P>>,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		storePartialModels?: boolean,
	): Observable<T | HalDocument<T, P>>;
}
