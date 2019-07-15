import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HttpResponse } from '@angular/common/http';
import { HalStorage } from '../../interfaces/hal-storage.interface';
import { RequestOptions } from '../../types/request-options.type';

interface StorageModel<T extends HalModel> {
  model: T | HalDocument<T>;
  etag: string;
}

export class EtagHalStorage implements HalStorage {
  private internalStorage: { [K: string]: StorageModel<any> } = {};

  public save<T extends HalModel>(model: T, response?: HttpResponse<T>): void {
    this.internalStorage[model.uniqueModelIdentificator] = {
      model,
      etag: this.getEtagFromResponse(response)
    };
  }

  public saveAll<T extends HalModel>(models: Array<T>, response?: HttpResponse<T>): void {
    models.forEach((model) => {
      this.internalStorage[model.uniqueModelIdentificator] = {
        model,
        etag: undefined
      };
    });
  }

  public saveHalDocument<T extends HalModel>(halDocument: HalDocument<T>, response?: HttpResponse<T>): void {
    this.internalStorage[halDocument.uniqueModelIdentificator] = {
      model: halDocument,
      etag: this.getEtagFromResponse(response)
    };
  }

  public get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T> {
    const localModel: StorageModel<T> = this.getRawStorageModel(uniqueModelIdentificator);
    return localModel ? localModel.model : undefined;
  }

  public remove(model: HalModel): void {
    delete this.internalStorage[model.uniqueModelIdentificator];
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
