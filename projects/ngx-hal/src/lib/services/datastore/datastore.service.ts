import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';
import { HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY } from '../../constants/metadata.constant';
import { HalDocumentConstructor } from '../../types/hal-document-construtor.type';
import { RequestOptions } from '../../types/request-options.type';
import { DEFAULT_REQUEST_OPTIONS } from '../../constants/request.constant';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';
import { HalStorage } from '../../classes/hal-storage';
import { ModelProperty } from '../../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../../enums/model-property.enum';

export class DatastoreService {
  public networkConfig: NetworkConfig = this.networkConfig || DEFAULT_NETWORK_CONFIG;
  private internalStorage: HalStorage = new HalStorage();

  constructor(public http: HttpClient) {}

  private getHalDocumentClass<T extends HalModel>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY, this.constructor) || HalDocument;
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
    const representantiveModel = new modelClass();
    const halDocumentClass = representantiveModel.getHalDocumentClass() || this.getHalDocumentClass<T>();
    return new halDocumentClass(response, modelClass, this);
  }

  public findOne<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    modelId: string,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {}
  ): Observable<T> {
    const url: string = this.buildModelUrl(modelClass, modelId);
    return this.handleGetRequestWithRelationships(url, requestOptions, modelClass, true, includeRelationships);
  }

  private fetchRelationships<T extends HalModel>(model: T, relationships: Array<string>): Array<Observable<any>> {
    const relationshipCalls: Array<Observable<any>> = [];

    const filteredRelationships: Array<string> = this.filterUnnecessaryIncludes(relationships);

    filteredRelationships.forEach((relationshipName: string) => {
      const relationshipNameParts: Array<string> = relationshipName.split('.');
      const currentLevelRelationship: string = relationshipNameParts.shift();

      const url: string = model.getRelationshipUrl(currentLevelRelationship);
      const property: ModelProperty = model.getPropertyData(currentLevelRelationship);
      const modelClass = property.propertyClass;
      const isSingleResource: boolean = property.type === ModelPropertyEnum.Attribute || property.type === ModelPropertyEnum.HasOne;

      const relationshipCall$: Observable<any> = this.handleGetRequestWithRelationships(
        url,
        {},
        modelClass,
        isSingleResource,
        relationshipNameParts.length ? [relationshipNameParts.join('.')] : []
      );

      relationshipCalls.push(relationshipCall$);
    });

    return relationshipCalls;
  }

  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: true,
    includeRelationships: Array<string>
  ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: false,
    includeRelationships: Array<string>
  ): Observable<HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>
    ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string> = []
  ): Observable<T | HalDocument<T>> {
    const httpRequest$ = this.makeGetRequest(url, requestOptions, modelClass, isSingleResource);

    if (includeRelationships.length) {
      return httpRequest$.pipe(
        flatMap((model: T | HalDocument<T>) => {
          const models: Array<T> = isSingleResource ? ([model] as Array<T>) : (model as HalDocument<T>).models;
          const relationshipCalls: Array<Observable<any>> = this.triggerFetchingModelRelationships(models, includeRelationships);

          return combineLatest(...relationshipCalls).pipe(
            map(() => model)
          );
        })
      );
    }

    return httpRequest$;
  }

  private triggerFetchingModelRelationships<T extends HalModel>(models: Array<T>, includeRelationships: Array<string>) {
    const modelRelationshipCalls: Array<Observable<any>> = [];

    models.forEach((model: T) => {
      const relationshipCalls = this.fetchRelationships(model, includeRelationships);
      modelRelationshipCalls.push(...relationshipCalls);
    });

    return modelRelationshipCalls;
  }

  public find<T extends HalModel>(modelClass: ModelConstructor<T>, params: object): Observable<Array<T>>;
  public find<T extends HalModel>(modelClass: ModelConstructor<T>, params: object, includeMeta: false): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: false,
    includeRelationships: Array<string>
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: true,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: boolean,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<HalDocument<T> | Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object = {},
    includeMeta: boolean = false,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {}
  ): Observable<HalDocument<T> | Array<T>> {
    const url: string = this.buildModelUrl(modelClass);

    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, requestOptions);
    Object.assign(options.params, params);

    return this.handleGetRequestWithRelationships(url, options, modelClass, false, includeRelationships).pipe(
      map((halDocument: HalDocument<T>) => includeMeta ? halDocument : halDocument.models)
    );
  }

  public get storage(): HalStorage {
    return this.internalStorage;
  }

  private makeGetRequest<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: false
  ): Observable<HalDocument<T>>;
  private makeGetRequest<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: true
  ): Observable<T>;
  private makeGetRequest<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean
  ): Observable<HalDocument<T> | T>;
  private makeGetRequest<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean
  ): Observable<HalDocument<T> | T> {
    const options = Object.assign(DEFAULT_REQUEST_OPTIONS, requestOptions);

    return this.http.get<T>(url, options).pipe(
      map((response: HttpResponse<T>) => {
        if (singleResource) {
          const model: T = new modelClass(this.extractResourceFromResponse(response), this, response);
          this.storage.save(model);
          return model;
        }

        const halDocument: HalDocument<T> = this.createHalDocument(response, modelClass);
        this.storage.saveAll(halDocument.models);
        return halDocument;
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

  private filterUnnecessaryIncludes(includes: Array<string>): Array<string> {
    const sortedIncludes: Array<string> = [].concat(includes).sort((a, b) => a.length - b.length);
    const filteredIncludes: Array<string> = [];

    let currentItem: string;
    while (currentItem = sortedIncludes.shift()) {
      const alreadyIncluded: boolean = sortedIncludes.some((item) => item.startsWith(currentItem));
      if (!alreadyIncluded) {
        filteredIncludes.push(currentItem);
      }
    }

    return filteredIncludes;
  }
}
