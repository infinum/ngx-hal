import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HttpResponse } from '@angular/common/http';
import { RequestOptions } from '../../types/request-options.type';
import { HalStorage } from './hal-storage';

interface StorageModel<T extends HalModel> {
  model: T | HalDocument<T>;
  etag: string;
}

export class EtagHalStorage extends HalStorage {
  public save<T extends HalModel>(model: T | HalDocument<T>, response?: HttpResponse<T>): void {
    this.internalStorage[model.uniqueModelIdentificator] = {
      model,
      etag: this.getEtagFromResponse(response)
    };
  }

  public get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T> {
    const localModel: StorageModel<T> = this.getRawStorageModel(uniqueModelIdentificator);
    return localModel ? localModel.model : undefined;
  }

  public enrichRequestOptions(uniqueModelIdentificator: string, requestOptions: RequestOptions): void {
    const storageModel: StorageModel<any> = this.getRawStorageModel(uniqueModelIdentificator);

    if (!storageModel) {
      return;
    }

    if (storageModel.etag) {
      requestOptions.headers = requestOptions.headers || {};
      requestOptions.headers['If-None-Match'] = storageModel.etag;
    }
  }

  private getRawStorageModel<T extends HalModel>(uniqueModelIdentificator: string): StorageModel<T> {
    return this.internalStorage[uniqueModelIdentificator];
  }

  private getEtagFromResponse<T>(response: HttpResponse<T>): string {
    if (!response || !response.headers || !response.headers.get) {
      return;
    }

    return response.headers.get('ETag');
  }
}
