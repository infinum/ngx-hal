import { HttpResponse } from '@angular/common/http';
import { HalModel } from '../../models/hal.model';
import { RequestOptions } from '../../types/request-options.type';
import { setRequestHeader } from '../../utils/set-request-header/set-request-header.util';
import { Pagination } from '../pagination';
import { HalDocument } from './../hal-document';
import { HalStorage } from './hal-storage';

export interface EtagStorageModel<T extends HalModel<P>, P extends Pagination> {
	model: T | HalDocument<T, P>;
	etag: string;
}

export class EtagHalStorage<P extends Pagination> extends HalStorage<P> {
	public save<T extends HalModel<P>>(
		model: T | HalDocument<T, P>,
		response?: HttpResponse<T>,
		alternateUniqueIdentificators: Array<string> = [],
	): Array<EtagStorageModel<T, P>> {
		const storedModels: Array<EtagStorageModel<T, P>> = [];

		const identificators: Array<string> = [].concat(alternateUniqueIdentificators);
		identificators.push(model.uniqueModelIdentificator);

		identificators.filter(Boolean).forEach((identificator: string) => {
			const storedModel = {
				model,
				etag: this.getEtagFromResponse(response),
			};
			this.internalStorage[identificator] = storedModel;
			storedModels.push(storedModel);
		});

		return storedModels;
	}

	public get<T extends HalModel<P>>(uniqueModelIdentificator: string): T | HalDocument<T, P> {
		const localModel: EtagStorageModel<T, P> = this.getRawStorageModel(uniqueModelIdentificator);
		return localModel ? localModel.model : undefined;
	}

	public enrichRequestOptions(
		uniqueModelIdentificator: string,
		requestOptions: RequestOptions,
	): void {
		const storageModel: EtagStorageModel<any, P> =
			this.getRawStorageModel(uniqueModelIdentificator);

		if (!storageModel) {
			return;
		}

		if (storageModel.etag) {
			requestOptions.headers = setRequestHeader(
				requestOptions.headers,
				'If-None-Match',
				storageModel.etag,
			);
		}
	}

	protected getRawStorageModel<T extends HalModel<P>>(
		uniqueModelIdentificator: string,
	): EtagStorageModel<T, P> {
		return this.internalStorage[uniqueModelIdentificator];
	}

	private getEtagFromResponse<T>(response: HttpResponse<T>): string {
		if (!response || !response.headers || !response.headers.get) {
			return;
		}

		return response.headers.get('ETag');
	}
}
