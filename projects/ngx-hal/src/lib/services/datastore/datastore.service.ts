import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';
import { HAL_DOCUMENT_CLASS_METADATA_KEY } from '../../constants/metadata.constant';
import { HalDocumentConstructor } from '../../types/hal-document-construtor.type';

@Injectable()
export class DatastoreService {
  public networkConfig: NetworkConfig = DEFAULT_NETWORK_CONFIG;

  constructor(public http: HttpClient) {
    console.log('v6');
  }

  public buildUrl(model?: HalModel): string {
    const urlParts: Array<string> = [
      this.networkConfig.baseUrl,
      this.networkConfig.endpoint,
      model ? model.endpoint : null
    ];

    return urlParts.filter((urlPart) => urlPart).join('/');
  }

  public createHalDocument<T extends HalModel>(response: HttpResponse<T>, modelClass: ModelConstructor<T>): HalDocument<T> {
    const halDocumentClass = this.getHalDocumentClass<T>();
    return new halDocumentClass(response, modelClass);
  }

  private getHalDocumentClass<T extends HalModel>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_DOCUMENT_CLASS_METADATA_KEY, this) || HalDocument;
  }
}
