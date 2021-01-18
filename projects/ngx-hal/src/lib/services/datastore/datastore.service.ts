import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { Observable, combineLatest, of, throwError, from } from 'rxjs';
import { map, flatMap, tap, catchError, mergeMap, delay } from 'rxjs/operators';
import * as UriTemplate from 'uri-templates';
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
import { CustomOptions } from '../../interfaces/custom-options.interface';
import { deepmergeWrapper } from '../../utils/deepmerge-wrapper';
import { RelationshipRequestDescriptor } from '../../types/relationship-request-descriptor.type';
import { ensureRelationshipRequestDescriptors } from '../../utils/ensure-relationship-descriptors/ensure-relationship-descriptors.util';
import { RelationshipDescriptorMappings } from '../../types/relationship-descriptor-mappings.type';
import { EMBEDDED_PROPERTY_NAME } from '../../constants/hal.constant';
import { HalStorage } from '../../classes/hal-storage/hal-storage';

@Injectable()
export class DatastoreService {
  public networkConfig: NetworkConfig = this['networkConfig'] || DEFAULT_NETWORK_CONFIG;
  private cacheStrategy: CacheStrategy; // set by Config decorator
  // tslint:disable-next-line
  private _storage: HalStorage; // set by Config decorator
  private internalStorage = createHalStorage(this.cacheStrategy, this._storage);
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
    includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
    requestOptions: RequestOptions = {},
    customUrl?: string,
    subsequentRequestsOptions: RequestOptions = {}
  ): Observable<T> {
    const url: string = customUrl || this.buildModelUrl(modelClass, modelId);

    const requestsOptions: RequestsOptions = {
      mainRequest: requestOptions,
      subsequentRequests: subsequentRequestsOptions
    };

    const relationshipDescriptors: Array<RelationshipRequestDescriptor> = ensureRelationshipRequestDescriptors(includeRelationships);

    return this.handleGetRequestWithRelationships(url, requestsOptions, modelClass, true, relationshipDescriptors);
  }

  public fetchModelRelationships<T extends HalModel>(
    model: T,
    relationshipNames: RelationshipRequestDescriptor | Array<RelationshipRequestDescriptor>,
    requestOptions: RequestOptions = {}
  ): Observable<T> {
    const ensuredRelationshipNames: Array<RelationshipRequestDescriptor> = [].concat(relationshipNames);

    const relationships$: Array<Observable<any>> = this.fetchRelationships(model, ensuredRelationshipNames, requestOptions);

    if (!relationships$.length) {
      return of(model);
    }

    return combineLatest(...relationships$).pipe(
      map(() => model)
    );
  }

  private fetchRelationships<T extends HalModel>(
    model: T,
    relationshipDescriptors: Array<RelationshipRequestDescriptor>,
    requestOptions: RequestOptions = {} // "global" options for all requests
  ): Array<Observable<any>> {
    const relationshipCalls: Array<Observable<any>> = [];

    const relationshipMappings: RelationshipDescriptorMappings = this.extractCurrentLevelRelationships(relationshipDescriptors);

    for (const relationshipName in relationshipMappings) {
      const url: string = model.getRelationshipUrl(relationshipName);
      const property: ModelProperty = model.getPropertyData(relationshipName);

      if (!property) {
        continue;
      }

      const modelClass = property.propertyClass;
      const isSingleResource: boolean = property.type === ModelPropertyEnum.Attribute || property.type === ModelPropertyEnum.HasOne;

      // Checks if the relationship is already embdedded inside the emdedded property, or
      // as a part of attribute properties
      const embeddedRelationship: RawHalResource = model.getEmbeddedResource(relationshipName);
      let fetchedModels: T | HalDocument<T>;

      if (embeddedRelationship) {
        fetchedModels = this.processRawResource(embeddedRelationship, modelClass, isSingleResource, model.rawResponse);
      }

      if (!url || url.startsWith(LOCAL_MODEL_ID_PREFIX) || url.startsWith(LOCAL_DOCUMENT_ID_PREFIX)) {
        continue;
      }

      // tslint:disable-next-line:max-line-length
      const relationshipRequestOptions = relationshipMappings[relationshipName].originalRelationshipDescriptor ? relationshipMappings[relationshipName].originalRelationshipDescriptor.options : null;
      const requestsOptions: RequestsOptions = {
        mainRequest: relationshipRequestOptions || requestOptions,
        subsequentRequests: requestOptions
      };

      const relationshipCall$: Observable<any> = this.handleGetRequestWithRelationships(
        url,
        requestsOptions,
        modelClass,
        isSingleResource,
        relationshipMappings[relationshipName].childrenRelationships,
        fetchedModels
      ).pipe(
        map((fetchedRelation) => {
          const externalRelationshipName: string = property.externalName;

          if (isHalModelInstance(model)) {
            if (property.type === ModelPropertyEnum.HasOne) {
              // The original relationship URL on the parent model must be replaced because
              // the actual relationship URL may have some query parameteres attached to it
              model.links[externalRelationshipName].href = fetchedRelation.uniqueModelIdentificator;
            } else {
              model.updateHasManyDocumentIdentificator(property, fetchedRelation.uniqueModelIdentificator);

              // In case of a HalDocument, halDocument.models may contain model instances which are not the same as the models
              // saved in local storage. That happens if the same models are fetch beforehand through another API call.
              // In that case, hasManyDocumentIdentificators of the models from HalDocument must be updated as well.
              const localModel: T = this.storage.get(model.uniqueModelIdentificator);
              if (localModel && localModel !== model) {
                localModel.updateHasManyDocumentIdentificator(property, fetchedRelation.uniqueModelIdentificator);
              }
            }
          }

          return fetchedRelation;
        })
      );

      relationshipCalls.push(relationshipCall$);
    }

    return relationshipCalls;
  }

  private extractCurrentLevelRelationships(
    relationshipDescriptors: Array<RelationshipRequestDescriptor>
  ): RelationshipDescriptorMappings {
    return relationshipDescriptors.reduce((
      relationships: RelationshipDescriptorMappings,
      currentRelationshipDescriptor: RelationshipRequestDescriptor
    ) => {
      const relationshipNameParts: Array<string> = currentRelationshipDescriptor.name.split('.');
      const currentLevelRelationship: string = relationshipNameParts.shift();

      relationships[currentLevelRelationship] = relationships[currentLevelRelationship] || { childrenRelationships: [] };
      if (relationshipNameParts.length) {
        relationships[currentLevelRelationship].childrenRelationships.push({
          name: relationshipNameParts.join('.'),
          options: currentRelationshipDescriptor.options
        });
      } else {
        relationships[currentLevelRelationship].originalRelationshipDescriptor = currentRelationshipDescriptor;
      }

      return relationships;
    }, {});
  }

  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: true,
    includeRelationships: Array<RelationshipRequestDescriptor>
  ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: false,
    includeRelationships: Array<RelationshipRequestDescriptor>
  ): Observable<HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<RelationshipRequestDescriptor>
    ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: true,
    includeRelationships: Array<RelationshipRequestDescriptor>,
    fetchedModels: T | HalDocument<T>
    ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<RelationshipRequestDescriptor>,
    fetchedModels: T
  ): Observable<T>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<RelationshipRequestDescriptor>,
    fetchedModels: HalDocument<T>
  ): Observable<HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<RelationshipRequestDescriptor>,
    fetchedModels: T | HalDocument<T>,
    storePartialModels?: boolean
  ): Observable<T | HalDocument<T>>;
  private handleGetRequestWithRelationships<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    includeRelationships: Array<RelationshipRequestDescriptor> = [],
    fetchedModels: T | HalDocument<T> = null,
    storePartialModels?: boolean
  ): Observable<T | HalDocument<T>> {
    if (fetchedModels) {
      return of(fetchedModels);
    }

    const httpRequest$ = this.makeGetRequestWrapper(url, requestsOptions, modelClass, isSingleResource, storePartialModels);

    if (includeRelationships.length) {
      return httpRequest$.pipe(
        flatMap((model: T | HalDocument<T>) => {
          const models: Array<T> = isSingleResource ? ([model] as Array<T>) : (model as HalDocument<T>).models;

          const relationshipCalls: Array<Observable<any>> = this.triggerFetchingModelRelationships(
            models,
            includeRelationships,
            requestsOptions.subsequentRequests
          );

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

  private makeGetRequestWrapper<T extends HalModel>(
    url: string,
    requestsOptions: RequestsOptions,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    storePartialModels?: boolean
  ): Observable<HalDocument<T> | T> {
    const originalGetRequest$: Observable<T | HalDocument<T>> = this.makeGetRequest(
      url,
      requestsOptions.mainRequest,
      modelClass,
      isSingleResource,
      storePartialModels
    );

    if (this.storage.makeGetRequestWrapper) {
      const { cleanUrl, urlWithParams, requestOptions: options } = this.extractRequestInfo(url, requestsOptions.mainRequest);
      const cachedResoucesFromUrl = this.storage.get(decodeURIComponent(url)) || this.storage.get(decodeURIComponent(urlWithParams));
      return this.storage.makeGetRequestWrapper(
        { cleanUrl, urlWithParams, originalUrl: url },
        cachedResoucesFromUrl,
        originalGetRequest$,
        options,
        modelClass,
        storePartialModels
      );
    }

    return originalGetRequest$;
  }

  private triggerFetchingModelRelationships<T extends HalModel>(
    models: Array<T>,
    includeRelationships: Array<RelationshipRequestDescriptor>,
    requestOptions?: RequestOptions
  ): Array<Observable<any>> {
    const modelRelationshipCalls: Array<Observable<any>> = [];

    models.forEach((model: T) => {
      const relationshipCalls = this.fetchRelationships(model, includeRelationships, requestOptions);
      modelRelationshipCalls.push(...relationshipCalls);
    });

    return modelRelationshipCalls;
  }

  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: false
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: false,
    includeRelationships: Array<string | RelationshipRequestDescriptor>
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: true,
    includeRelationships: Array<string | RelationshipRequestDescriptor>
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: true,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: true,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl?: string
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: false,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions
  ): Observable<Array<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: boolean,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: boolean,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl: string
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: boolean,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl: string,
    subsequentRequestsOptions: RequestOptions
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: true,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl: string,
    subsequentRequestsOptions: RequestOptions,
    storePartialModels?: boolean
  ): Observable<HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: false,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl: string,
    subsequentRequestsOptions: RequestOptions,
    storePartialModels?: boolean
  ): Observable<T>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams,
    includeMeta: boolean,
    includeRelationships: Array<string | RelationshipRequestDescriptor>,
    requestOptions: RequestOptions,
    customUrl: string,
    subsequentRequestsOptions: RequestOptions,
    storePartialModels?: boolean
  ): Observable<Array<T> | HalDocument<T>>;
  public find<T extends HalModel>(
    modelClass: ModelConstructor<T>,
    params: object | { [param: string]: string | string[] } | HttpParams = {},
    includeMeta: boolean = false,
    includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
    requestOptions: RequestOptions = {},
    customUrl?: string,
    subsequentRequestsOptions: RequestOptions = {},
    storePartialModels: boolean = false
  ): Observable<HalDocument<T> | Array<T>> {
    const url: string = customUrl || this.buildModelUrl(modelClass);

    const subsequentOptions: RequestOptions = deepmergeWrapper({}, subsequentRequestsOptions);

    const paramsObject: object = this.ensureParamsObject(params || {});
    requestOptions.params = this.ensureParamsObject(requestOptions.params || {});
    requestOptions.params = Object.assign(requestOptions.params, paramsObject);

    const options: RequestOptions = deepmergeWrapper({}, requestOptions);

    const requestsOptions: RequestsOptions = {
      mainRequest: options,
      subsequentRequests: subsequentOptions
    };

    const relationshipDescriptors: Array<RelationshipRequestDescriptor> = ensureRelationshipRequestDescriptors(includeRelationships);

    return this.handleGetRequestWithRelationships(
      url,
      requestsOptions,
      modelClass,
      false,
      relationshipDescriptors,
      null,
      storePartialModels
    ).pipe(
      flatMap((halDocument: HalDocument<T>) => {
        return this.fetchEmbeddedListItems(halDocument, modelClass, relationshipDescriptors, subsequentOptions).pipe(
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
    saveOptions: CustomOptions<T> = {}
  ): Observable<T> {
    const defaultSaveOptions: CustomOptions<T> = {
      buildUrlFunction: this.defaultUrlBuildFunction,
      specificFields: null,
      transformPayloadBeforeSave: this.defaultTransformPayloadBeforeSaveFunction
    };

    const options: CustomOptions<T> = deepmergeWrapper(defaultSaveOptions, saveOptions);

    const url: string = options.buildUrlFunction(model, this.buildUrl(model));
    const payload: object = model.generatePayload({
      specificFields: options.specificFields,
      changedPropertiesOnly: false
    });

    const transformedPaylaod: object = options.transformPayloadBeforeSave(payload);
    const modelHeaders: object = model.generateHeaders();

    const modelRequestOptions: RequestOptions = requestOptions || {};
    modelRequestOptions.headers = modelRequestOptions.headers || {};
    Object.assign(modelRequestOptions.headers, modelHeaders);

    let request$;

    if (model.isSaved) {
      request$ = this.makePutRequest(url, transformedPaylaod, modelRequestOptions);
    } else {
      request$ = this.makePostRequest(url, transformedPaylaod, modelRequestOptions);
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
    requestOptions?: RequestOptions,
    updateOptions: CustomOptions<T> = {}
  ): Observable<T> {
    const defaultUpdateOptions: CustomOptions<T> = {
      buildUrlFunction: this.defaultUrlBuildFunction,
      specificFields: null,
      transformPayloadBeforeSave: this.defaultTransformPayloadBeforeSaveFunction
    };

    const options: CustomOptions<T> = deepmergeWrapper(defaultUpdateOptions, updateOptions);

    const url: string = options.buildUrlFunction(model, this.buildUrl(model));
    const payload: object = model.generatePayload({ specificFields: options.specificFields, changedPropertiesOnly: true });
    const transformedPaylaod: object = options.transformPayloadBeforeSave(payload);
    const modelHeaders: object = model.generateHeaders();

    const modelRequestOptions: RequestOptions = requestOptions || {};
    modelRequestOptions.headers = modelRequestOptions.headers || {};
    Object.assign(modelRequestOptions.headers, modelHeaders);

    return this.makePatchRequest(url, transformedPaylaod, modelRequestOptions).pipe(
      map(() => {
        this.updateModelWithChangedProperties(model, transformedPaylaod);
        return model;
      })
    );
  }

  public delete<T extends HalModel>(
    model: T,
    requestOptions?: RequestOptions,
    updateOptions: CustomOptions<T> = {}
  ): Observable<void> {
    const defaultUpdateOptions: CustomOptions<T> = {
      buildUrlFunction: this.defaultUrlBuildFunction
    };

    const options: CustomOptions<T> = deepmergeWrapper(defaultUpdateOptions, updateOptions);
    const url: string = options.buildUrlFunction(model, this.buildUrl(model));

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
    singleResource: boolean,
    storePartialModels?: boolean
  ): Observable<HalDocument<T> | T>;
  private makeGetRequest<T extends HalModel>(
    url: string,
    requestOptions: RequestOptions,
    modelClass: ModelConstructor<T>,
    singleResource: boolean,
    storePartialModels?: boolean
  ): Observable<HalDocument<T> | T> {
    const { cleanUrl, requestOptions: options, urlWithParams } = this.extractRequestInfo(url, requestOptions);

    return this.http.get<T>(cleanUrl, options as any).pipe(
      map((response: HttpResponse<T>) => {
        const rawResource: RawHalResource = this.extractResourceFromResponse(response);
        return this.processRawResource(rawResource, modelClass, singleResource, response, urlWithParams, storePartialModels);
      }),
      catchError((response: HttpResponse<T>) => {
        if (response.status === 304) {
          const cachedModel: T = this.storage.get(url) || this.storage.get(response.url);

          if (cachedModel) {
            return of(cachedModel);
          }
        }

        return throwError(response);
      })
    );
  }

  private extractRequestInfo(
    url: string,
    options: RequestOptions
  ): { cleanUrl: string, urlWithParams: string, requestOptions: RequestOptions } {
    const params: object = this.ensureParamsObject(options.params || {});
    Object.assign(options, { params });
    const requestOptions: RequestOptions = deepmergeWrapper(DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, options);

    this.storage.enrichRequestOptions(url, options);

    const templatedUrl: string = (new UriTemplate(url)).fill(options.params);

    const urlQueryParams: object = getQueryParams(templatedUrl);
    requestOptions.params = Object.assign(urlQueryParams, requestOptions.params);

    const cleanUrl: string = removeQueryParams(templatedUrl);
    const queryParamsString: string = makeQueryParamsString(requestOptions.params, true);
    const urlWithParams = queryParamsString ? `${cleanUrl}?${queryParamsString}` : cleanUrl;

    requestOptions.params = makeHttpParams(requestOptions.params, this.httpParamsOptions);

    return {
      cleanUrl,
      urlWithParams,
      requestOptions
    };
  }

  private ensureParamsObject(
    params: HttpParams | { [param: string]: string | string[] } | object
  ): { [param: string]: string | string[]} | object {
    if (params instanceof HttpParams) {
      return params.keys().reduce((paramsObject: object, paramName: string) => {
        const arrayParam = params.getAll(paramName);
        paramsObject[paramName] = arrayParam.length > 1 ? arrayParam : params.get(paramName);
        return paramsObject;
      }, {});
    }

    return params;
  }

  private enrichRequestOptions(requestOptions: RequestOptions) {
    const reqOptions: RequestOptions = requestOptions || {};
    const params: object = this.ensureParamsObject(reqOptions.params || {});
    Object.assign(reqOptions, { params });
    return deepmergeWrapper(DEFAULT_REQUEST_OPTIONS, this.networkConfig.globalRequestOptions, reqOptions);
  }

  private makePostRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions = {}): Observable<any> {
    const options = this.enrichRequestOptions(requestOptions);
    return this.http.post<T>(url, payload, options);
  }

  private makePutRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions = {}): Observable<any> {
    const options = this.enrichRequestOptions(requestOptions);
    return this.http.put<T>(url, payload, options);
  }

  private makePatchRequest<T extends HalModel>(url: string, payload: object, requestOptions: RequestOptions = {}): Observable<any> {
    const options = this.enrichRequestOptions(requestOptions);
    return this.http.patch<T>(url, payload, options);
  }

  private makeDeleteRequest<T extends HalModel>(url: string, requestOptions: RequestOptions = {}): Observable<any> {
    const options = this.enrichRequestOptions(requestOptions);
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
    url?: string,
    savePartialModels?: boolean
  ): T | HalDocument<T>;
  private processRawResource<T extends HalModel>(
    rawResource: RawHalResource,
    modelClass: ModelConstructor<T>,
    isSingleResource: boolean,
    response: HttpResponse<T>,
    url?: string,
    savePartialModels?: boolean
  ): T | HalDocument<T> {
    if (isSingleResource) {
      const model: T = new modelClass(rawResource, this, response);
      this.populateResourceWithRelationshipIndentificators(model);
      this.storage.save(model, response, [url]);
      return model;
    }

    const halDocument: HalDocument<T> = this.createHalDocument(rawResource, modelClass, response);

    this.storage.saveAll(halDocument.models, savePartialModels);

    halDocument.models.forEach((listModel: T) => {
      this.populateResourceWithRelationshipIndentificators(listModel);
    });

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

  private populateResourceWithRelationshipIndentificators<T extends HalModel>(model: T): void {
    const localResource: T = this.storage.get(model.uniqueModelIdentificator);
    if (localResource) {
      model.hasManyDocumentIdentificators = localResource.hasManyDocumentIdentificators;
    }
  }

  private fetchEmbeddedListItems<T extends HalModel>(
    halDocument: HalDocument<T>,
    modelClass: ModelConstructor<T>,
    includeRelationships: Array<RelationshipRequestDescriptor> = [],
    requestOptions: RequestOptions = {}
  ): Observable<Array<T>> {
    const modelCalls: Array<Observable<T>> = [];

    const requestsOptions: RequestsOptions = {
      mainRequest: requestOptions,
      subsequentRequests: requestOptions
    };

    // Don't fetch list items if they are embedded
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

  private defaultTransformPayloadBeforeSaveFunction(payload: object): object {
    return payload;
  }

  public createModel<T extends HalModel>(modelClass: ModelConstructor<T>, recordData: object = {}): T {
    const rawRecordData: object = Object.assign({}, recordData);
    rawRecordData[EMBEDDED_PROPERTY_NAME] = Object.assign({}, recordData, recordData[EMBEDDED_PROPERTY_NAME]);
    const model: T =  new modelClass(rawRecordData, this);
    return model;
  }
}
