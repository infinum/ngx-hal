import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkConfig } from '../../interfaces/network-config.interface';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';
import { HAL_DOCUMENT_CLASS_METADATA_KEY } from '../../constants/metadata.constant';
import { HalDocumentConstructor } from '../../types/hal-document-construtor.type';
import { RequestOptions } from '../../types/request-options.type';
import { DEFAULT_REQUEST_OPTIONS } from '../../constants/request.constant';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';

export class DatastoreService {
  public networkConfig: NetworkConfig;

  constructor(public http: HttpClient) {}

  private getHalDocumentClass<T extends HalModel>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_DOCUMENT_CLASS_METADATA_KEY, this.constructor) || HalDocument;
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

  public findOne<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    modelId: string,
    requestOptions: RequestOptions = {}
  ): Observable<T> {
    const url: string = this.buildModelUrl(modelClass, modelId);

    const options = Object.assign(DEFAULT_REQUEST_OPTIONS, requestOptions);

    return this.http.get<T>(url, options).pipe(
      map((response: HttpResponse<T>) => {
        return new modelClass(this.extractResourceFromResponse(response), response);
      })
    );
  }

  public find<T extends HalModel>(modelClass: ModelConstructor<T>, params: object): Observable<Array<T>>;
  public find<T extends HalModel>(modelClass: ModelConstructor<T>, params: object, includeMeta: boolean): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object, includeMeta: boolean,
    requestOptions: RequestOptions
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object = {},
    includeMeta: boolean = false,
    requestOptions: RequestOptions = {}
  ): Observable<HalDocument<T>> | Observable<Array<T>> {
    const url: string = this.buildModelUrl(modelClass);

    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, requestOptions);
    Object.assign(options.params, params);

    if (includeMeta) {
      return this.http.get<T>(url, options).pipe(
        map((response: HttpResponse<T>) => {
          const halDocument: HalDocument<T> = this.createHalDocument(response, modelClass);
          return halDocument;
        })
      );
    }

    return this.http.get<T>(url, options).pipe(
      map((response: HttpResponse<T>) => {
        const halDocument: HalDocument<T> = this.createHalDocument(response, modelClass);
        return halDocument.models;
      })
    );
  }

  private buildModelUrl(modelClass: ModelConstructor<HalModel>, modelId?: string): string {
    const modelUrl: string = this.buildUrl(new modelClass());
    return modelId ? `${modelUrl}/${modelId}` : modelUrl;
  }

  private extractResourceFromResponse(response: HttpResponse<object>): RawHalResource {
    return response.body;
  }
}
