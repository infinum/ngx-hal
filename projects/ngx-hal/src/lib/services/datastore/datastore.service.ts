import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, flatMap, tap } from 'rxjs/operators';
import { NetworkConfig, DEFAULT_NETWORK_CONFIG } from '../../interfaces/network-config.interface';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';
import { HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY } from '../../constants/metadata.constant';
import { LOCAL_MODEL_ID_PREFIX, LOCAL_DOCUMENT_ID_PREFIX } from '../../constants/general.constant';
import { HalDocumentConstructor } from '../../types/hal-document-construtor.type';
import { RequestOptions } from '../../types/request-options.type';
import { DEFAULT_REQUEST_OPTIONS } from '../../constants/request.constant';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';
import { ModelProperty, AttributeModelProperty } from '../../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../../enums/model-property.enum';
import { RawHalLink } from '../../interfaces/raw-hal-link.interface';
import { PaginationConstructor } from '../../types/pagination.type';
import { getResponseHeader } from '../../utils/get-response-headers/get-response-header.util';
import { CacheStrategy } from '../../enums/cache-strategy.enum';
import { createHalStorage } from '../../classes/hal-storage/hal-storage-factory';
import { RequestsOptions } from '../../interfaces/requests-options.interface';
import { makeQueryParamsString } from '../../helpers/make-query-params-string/make-query-params-string.helper';
import { removeQueryParams } from '../../utils/remove-query-params/remove-query-params.util';
import { getQueryParams } from '../../utils/get-query-params/get-query-params.util';
import { isHalModelInstance } from '../../helpers/is-hal-model-instance.ts/is-hal-model-instance.helper';
import { makeHttpParams } from '../../helpers/make-http-params/make-http-params.helper';

@Injectable()
export class DatastoreService {
  public networkConfig: NetworkConfig = this['networkConfig'] || DEFAULT_NETWORK_CONFIG;
  private cacheStrategy: CacheStrategy;
  private internalStorage  = createHalStorage(this.cacheStrategy);
  protected httpParamsOptions?: object;
  public paginationClass: PaginationConstructor;

  constructor(public http: HttpClient) {}

  private getHalDocumentClass<T extends HalModel>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY, this.constructor) || HalDocument;
  }

  public buildUrl(model?: HalModel): string {
    const hostUrl: string = this.buildHostUrl(model);

    const urlParts: Array<string> = [
      hostUrl,
      model ? model.endpoint : null
    ];

    if (model && model.id) {
      urlParts.push(model.id);
    }

    return urlParts.filter((urlPart) => urlPart).join('/');
  }

  public createHalDocument<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    rawResponse?: HttpResponse<any>
  ): HalDocument<T> {
    const representantiveModel = new modelClass({}, this);
    const halDocumentClass = representantiveModel.getHalDocumentClass() || this.getHalDocumentClass<T>();
    return new halDocumentClass(rawResource, rawResponse, modelClass, this);
  }

  public findOne<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    modelId: string,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {},
    customUrl?: string,
    subsequentRequestsOptions: RequestOptions = {}
  ): Observable<T> {
    const url: string = customUrl || this.buildModelUrl(modelClass, modelId);

    const requestsOptions: RequestsOptions = {
      mainRequest: requestOptions,
      subsequentRequests: subsequentRequestsOptions
    };

    return this.handleGetRequestWithRelationships(url, requestsOptions, modelClass, true, includeRelationships);
  }

  public fetchModelRelationships<T extends HalModel>(model: T, relationshipNames: string | Array<string>): Observable<T> {
    const ensuredRelationshipNames: Array<string> = [].concat(relationshipNames);

    const relationships$: Array<Observable<any>> = this.fetchRelationships(model, ensuredRelationshipNames);

    if (!relationships$.length) {
      return of(model);
    }

    return combineLatest(...relationships$).pipe(
      map(() => model)
    );
  }

  private fetchRelationships<T extends HalModel>(
    model: T,
    relationships: Array<string>,
    requestOptions: RequestOptions = {}
  ): Array<Observable<any>> {
    const relationshipCalls: Array<Observable<any>> = [];

    const filteredRelationships: Array<string> = this.filterUnnecessaryIncludes(relationships);

    const currentLevelRelationshipsMap: object = filteredRelationships.reduce((relationships: any, currentRelationshipName: string) => {
      const relationshipNameParts: Array<string> = currentRelationshipName.split('.');
      const currentLevelRelationship: string = relationshipNameParts.shift();

      relationships[currentLevelRelationship] = relationships[currentLevelRelationship] || [];
      relationships[currentLevelRelationship].push(relationshipNameParts.join('.'));

      return relationships;
    }, {});

    const currentLevelRelationships: Array<string> = Object.keys(currentLevelRelationshipsMap);

    for (let i = 0; i < currentLevelRelationships.length; i += 1) {
      const currentLevelRelationshipName: string = currentLevelRelationships[i];
      const url: string = model.getRelationshipUrl(currentLevelRelationshipName);
      const property: ModelProperty = model.getPropertyData(currentLevelRelationshipName);

      if (!property) {
        continue;
      }

      const modelClass = property.propertyClass;
      const isSingleResource: boolean = property.type === ModelPropertyEnum.Attribute || property.type === ModelPropertyEnum.HasOne;

      // Checks if the relationship is already embdedded inside the emdedded property, or
      // as a part of attribute properties
      const embeddedRelationship: RawHalResource = model.getEmbeddedResource(currentLevelRelationshipName);
      let fetchedModels: T | HalDocument<T>;

      if (embeddedRelationship) {
        fetchedModels = this.processRawResource(embeddedRelationship, modelClass, isSingleResource, model.rawResponse);
      }

      if (!url || url.startsWith(LOCAL_MODEL_ID_PREFIX) || url.startsWith(LOCAL_DOCUMENT_ID_PREFIX)) {
        continue;
      }

      const requestsOptions: RequestsOptions = {
        mainRequest: requestOptions,
        subsequentRequests: requestOptions
      };

      const relationshipCall$: Observable<any> = this.handleGetRequestWithRelationships(
        url,
        requestsOptions,
        modelClass,
        isSingleResource,
        currentLevelRelationshipsMap[currentLevelRelationshipName],
        fetchedModels
      ).pipe(
        map((fetchedRelation) => {
          const actualRelationshipSelfLink: string = fetchedRelation.selfLink;
          const externalRelationshipName: string = property.externalName;

          if (isHalModelInstance(model)) {
            // The original relationship URL on the parent model must be replaced because
            // the actual relationship URL may have some query parameteres attached to it
            model.links[externalRelationshipName].href = actualRelationshipSelfLink;
          }

          return fetchedRelation;
        })
      );

      relationshipCalls.push(relationshipCall$);
    }

    return relationshipCalls;
  }

  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: true,
    includeRelationships: Array<string>
  ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: false,
    includeRelationships: Array<string>
  ): Observable<HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>
    ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>,
    fetchedModels: T | HalDocument<T>,
    subsequentRequestsOptions: RequestsOptions
    ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>,
    fetchedModels: T
  ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>,
    fetchedModels: HalDocument<T>
  ): Observable<HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string>,
    fetchedModels: T | HalDocument<T>
  ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<string> = [],
    fetchedModels: T | HalDocument<T> = null
  ): Observable<T | HalDocument<T>> {
    if (fetchedModels) {
      return of(fetchedModels);
    }

    const httpRequest$ = this.makeGetRequest(url, requestsOptions.mainRequest, modelClass, isSingleResource);

    if (includeRelationships.length) {
      return httpRequest$.pipe(
        flatMap((model: T | HalDocument<T>) => {
          const models: Array<T> = isSingleResource ? ([model] as Array<T>) : (model as HalDocument<T>).models;

          // tslint:disable-next-line:max-line-length
          const relationshipCalls: Array<Observable<any>> = this.triggerFetchingModelRelationships(models, includeRelationships, requestsOptions.subsequentRequests);

          if (!relationshipCalls.length) {
            return of(model);
          }

          return combineLatest(...relationshipCalls).pipe(
            map(() => model)
          );
        })
      );
    }

    return httpRequest$;
  }

  private triggerFetchingModelRelationships<T extends HalModel>(
    models: Array<T>,
    includeRelationships: Array<string>,
    requestOptions?: RequestOptions
  ): Array<Observable<any>> {
    const modelRelationshipCalls: Array<Observable<any>> = [];

    models.forEach((model: T) => {
      const relationshipCalls = this.fetchRelationships(model, includeRelationships, requestOptions);
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
    includeRelationships: Array<string>
  ): Observable<HalDocument<T>>;
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
    includeMeta: true,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions,
    customUrl?: string
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: true,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions,
    customUrl?: string,
    subsequentRequestsOptions?: RequestOptions
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: false,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: boolean,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: boolean,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions,
    customUrl: string
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object,
    includeMeta: boolean,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions,
    customUrl: string,
    subsequentRequestsOptions: RequestOptions
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object = {},
    includeMeta: boolean = false,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {},
    customUrl?: string,
    subsequentRequestsOptions: RequestOptions = {}
  ): Observable<HalDocument<T> | Array<T>> {
    const url: string = customUrl || this.buildModelUrl(modelClass);
    const options = Object.assign({}, requestOptions);
    options.params = Object.assign({}, options.params, params);

    const requestsOptions: RequestsOptions = {
      mainRequest: options,
      subsequentRequests: subsequentRequestsOptions
    };

    return this.handleGetRequestWithRelationships(url, requestsOptions, modelClass, false, includeRelationships).pipe(
      flatMap((halDocument: HalDocument<T>) => {
        return this.fetchEmbeddedListItems(halDocument, modelClass, includeRelationships, subsequentRequestsOptions).pipe(
          map((models: Array<T>) => {
            halDocument.models = models;
            return halDocument;
          })
        );
      }),
      map((halDocument: HalDocument<T>) => includeMeta ? halDocument : halDocument.models)
    );
  }

  public save<T extends HalModel>(
    model: T,
    modelClass: ModelConstructor<T>,
    requestOptions?: RequestOptions,
    urlBuildFunction: (model: T, urlFromModel: string) => string = this.defaultUrlBuildFunction
  ): Observable<T> {
    const url: string = urlBuildFunction(model, this.buildUrl(model));
    const payload: object = model.generatePayload();
    const modelHeaders: object = model.generateHeaders();

    const modelRequestOptions: RequestOptions = requestOptions || {};
    modelRequestOptions.headers = modelRequestOptions.headers || {};
    Object.assign(modelRequestOptions.headers, modelHeaders);

    let request$;

    if (model.isSaved) {
      request$ = this.makePutRequest(url, payload, modelRequestOptions);
    } else {
      request$ = this.makePostRequest(url, payload, modelRequestOptions);
    }

    return request$.pipe(
      map((response: HttpResponse<T>) => {
        const rawResource: RawHalResource = this.extractResourceFromResponse(response);
        if (rawResource) {
          return this.processRawResource(rawResource, modelClass, true, response);
        }

        const newLocationLink: string = getResponseHeader(response, 'Location');
        if (newLocationLink && model.selfLink !== newLocationLink) {
          model.selfLink = newLocationLink;
        }

        if (!this.storage.get(model.selfLink)) {
          this.storage.save(model, response);
        }

        return model;
      })
    );
  }

  // TODO this updated Attribute properties only, implement HasOne and HasMany properties
  private updateModelWithChangedProperties<T extends HalModel>(model: T, payload: object) {
    Object.keys(payload).forEach((externalPropertyName: string) => {
      const property: AttributeModelProperty = model.getPropertyData(externalPropertyName);

      if (payload[externalPropertyName] && property && property.type === ModelPropertyEnum.Attribute) {
        model['resource'][externalPropertyName] = payload[externalPropertyName];
      }
    });
  }

  public update<T extends HalModel>(
    model: T,
    specificFields?: Array<string>,
    requestOptions?: RequestOptions,
    urlBuildFunction: (model: T, urlFromModel: string) => string = this.defaultUrlBuildFunction
  ): Observable<T> {
    const url: string = urlBuildFunction(model, this.buildUrl(model));
    const payload: object = model.generatePayload({ specificFields, changedPropertiesOnly: true });
    const modelHeaders: object = model.generateHeaders();

    const modelRequestOptions: RequestOptions = requestOptions || {};
    modelRequestOptions.headers = modelRequestOptions.headers || {};
    Object.assign(modelRequestOptions.headers, modelHeaders);

    return this.makePatchRequest(url, payload, modelRequestOptions).pipe(
      map(() => {
        this.updateModelWithChangedProperties(model, payload);
        return model;
      })
    );
  }

  public delete<T extends HalModel>(model: T, requestOptions?: RequestOptions, customUrl?: string): Observable<void> {
    const url: string = customUrl || this.buildUrl(model);
    return this.makeDeleteRequest(url, requestOptions).pipe(
      tap(() => {
        this.storage.remove(model);
      })
    );
  }

  public get storage(): any {
    return this.internalStorage;
  }

  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: false
  ): Observable<HalDocument<T>>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: false,
    includeNetworkConfig: false
  ): Observable<HalDocument<T>>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: false,
    includeNetworkConfig: true
  ): Observable<HalDocument<T>>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: true
  ): Observable<T>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean
  ): Observable<HalDocument<T> | T>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean,
    includeNetworkConfig?: boolean
  ): Observable<HalDocument<T> | T>;
  public request<T extends HalModel>(
    method: string,
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean,
    includeNetworkConfig: boolean = true
  ): Observable<HalDocument<T> | T> {
    const customUrl: string = includeNetworkConfig ? `${this.buildHostUrl(new modelClass({}, this))}/${url}` : url;

    switch (method.toLocaleLowerCase()) {
      case 'get':
        return this.makeGetRequest(customUrl, requestOptions, modelClass, singleResource);
      default:
        throw new Error(`Method ${method} is not supported.`);
    }
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
    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, requestOptions);

    this.storage.enrichRequestOptions(url, options);

    const urlQueryParams: object = getQueryParams(url);
    options.params = Object.assign(urlQueryParams, options.params);

    const cleanUrl: string = removeQueryParams(url);
    const queryParamsString: string = makeQueryParamsString(options.params, true);
    const urlWithParams = queryParamsString ? `${cleanUrl}?${queryParamsString}` : cleanUrl;

    options.params = makeHttpParams(options.params, this.httpParamsOptions);

    return this.http.get<T>(cleanUrl, options).pipe(
      map((response: HttpResponse<T>) => {
        const rawResource: RawHalResource = this.extractResourceFromResponse(response);
        return this.processRawResource(rawResource, modelClass, singleResource, response, urlWithParams);
      })
    );
  }

  private makePostRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions): Observable<any> {
    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, requestOptions);
    return this.http.post<T>(url, payload, options);
  }

  private makePutRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions): Observable<any> {
    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, requestOptions);
    return this.http.put<T>(url, payload, options);
  }

  private makePatchRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions): Observable<any> {
    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, requestOptions);
    return this.http.patch<T>(url, payload, options);
  }

  private makeDeleteRequest<T extends HalModel>(url: string, requestOptions: RequestOptions): Observable<any> {
    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, requestOptions);
    return this.http.delete<T>(url, options);
  }

  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: false,
    response: HttpResponse<T>
  ): HalDocument<T>;
  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: true,
    response: HttpResponse<T>
  ): T;
  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    response: HttpResponse<T>
  ): T | HalDocument<T>;
  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    response: HttpResponse<T>,
    url?: string
  ): T | HalDocument<T>;
  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    response: HttpResponse<T>,
    url?: string
  ): T | HalDocument<T> {
    if (isSingleResource) {
      const model: T = new modelClass(rawResource, this, response);
      this.storage.save(model, response, [url]);
      return model;
    }

    const halDocument: HalDocument<T> = this.createHalDocument(rawResource, modelClass, response);
    this.storage.saveAll(halDocument.models);
    this.storage.save(halDocument, response, [url]);
    return halDocument;
  }

  private buildModelUrl(modelClass: ModelConstructor<HalModel>, modelId?: string): string {
    const modelUrl: string = this.buildUrl(new modelClass({}, this));
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
      const alreadyIncluded: boolean = sortedIncludes.some((item) => item.startsWith(`${currentItem}.`));
      if (!alreadyIncluded) {
        filteredIncludes.push(currentItem);
      }
    }

    return filteredIncludes;
  }

  private fetchEmbeddedListItems<T extends HalModel>(
    halDocument: HalDocument<T>,
    modelClass: ModelConstructor<T>,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {}
  ): Observable<Array<T>> {
    const modelCalls: Array<Observable<T>> = [];

    const requestsOptions: RequestsOptions = {
      mainRequest: requestOptions,
      subsequentRequests: requestOptions
    };

    // Don't fetch the list items if they are embedded
    if (halDocument.hasEmbeddedItems) {
      halDocument.models.forEach((model: T) => {
        const call$ = this.handleGetRequestWithRelationships(null, requestsOptions, modelClass, true, includeRelationships, model);
        modelCalls.push(call$);
      });
    } else {
      halDocument.itemLinks.forEach((link: RawHalLink) => {
        const url: string = link.href;

        if (url) {
          const call$ = this.handleGetRequestWithRelationships(url, requestsOptions, modelClass, true, includeRelationships);
          modelCalls.push(call$);
        }
      });
    }

    if (!modelCalls.length) {
      return of([]);
    }

    return combineLatest(...modelCalls);
  }

  private buildHostUrl(model?: HalModel): string {
    // tslint:disable-next-line:max-line-length
    const baseUrl: string = model && model.networkConfig && model.networkConfig.baseUrl ? model.networkConfig.baseUrl : this.networkConfig.baseUrl;
    // tslint:disable-next-line:max-line-length
    const networkEndpoint: string = model && model.networkConfig && model.networkConfig.endpoint ? model.networkConfig.endpoint : this.networkConfig.endpoint;

    return [baseUrl, networkEndpoint].filter((urlPart) => urlPart).join('/');
  }

  private defaultUrlBuildFunction<T extends HalModel>(model: T, urlFromModel: string): string {
    return urlFromModel;
  }
}
