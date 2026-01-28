import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, throwError } from 'rxjs';
import { catchError, flatMap, map, tap } from 'rxjs/operators';
import { HalDocument } from '../../classes/hal-document';
import { HalStorage } from '../../classes/hal-storage/hal-storage';
import { createHalStorage } from '../../classes/hal-storage/hal-storage-factory';
import { Pagination } from '../../classes/pagination';
import { EMBEDDED_PROPERTY_NAME } from '../../constants/hal.constant';
import { HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY } from '../../constants/metadata.constant';
import { DEFAULT_REQUEST_OPTIONS } from '../../constants/request.constant';
import { CacheStrategy } from '../../enums/cache-strategy.enum';
import { ModelProperty as ModelPropertyEnum } from '../../enums/model-property.enum';
import { isFunction } from '../../helpers/is-function/is-function.helper';
import { isHalModelInstance } from '../../helpers/is-hal-model-instance/is-hal-model-instance.helper';
import { makeHttpParams } from '../../helpers/make-http-params/make-http-params.helper';
import { makeQueryParamsString } from '../../helpers/make-query-params-string/make-query-params-string.helper';
import { getObjProperty } from '../../helpers/metadata/metadata.helper';
import { populateTemplatedUrl } from '../../helpers/populate-templated-url/populate-templated-url.helper';
import { CustomOptions } from '../../interfaces/custom-options.interface';
import { AttributeModelProperty, ModelProperty } from '../../interfaces/model-property.interface';
import { DEFAULT_NETWORK_CONFIG, NetworkConfig } from '../../interfaces/network-config.interface';
import { RawHalLink } from '../../interfaces/raw-hal-link.interface';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';
import { RequestsOptions } from '../../interfaces/requests-options.interface';
import { HalModel } from '../../models/hal.model';
import { HalDocumentConstructor } from '../../types/hal-document-constructor.type';
import { ModelConstructor, ModelConstructorFn } from '../../types/model-constructor.type';
import { RelationshipDescriptorMappings } from '../../types/relationship-descriptor-mappings.type';
import { RelationshipRequestDescriptor } from '../../types/relationship-request-descriptor.type';
import { RequestOptions } from '../../types/request-options.type';
import { deepmergeWrapper } from '../../utils/deepmerge-wrapper';
import { ensureRelationshipRequestDescriptors } from '../../utils/ensure-relationship-descriptors/ensure-relationship-descriptors.util';
import {
	decodeURIComponentWithErrorHandling,
	getQueryParams,
} from '../../utils/get-query-params/get-query-params.util';
import { getResponseHeader } from '../../utils/get-response-headers/get-response-header.util';
import { isString } from '../../utils/is-string/is-string.util';
import { removeQueryParams } from '../../utils/remove-query-params/remove-query-params.util';

@Injectable()
export class DatastoreService<P extends Pagination> {
	public networkConfig: NetworkConfig = this['networkConfig'] || DEFAULT_NETWORK_CONFIG;
	private _cacheStrategy: CacheStrategy;
	// eslint:disable-next-line
	private _storage: HalStorage<P>; // set by Config decorator
	private internalStorage = createHalStorage(this.cacheStrategy, this.halStorage);
	protected httpParamsOptions?: object;
	public paginationClass: { new (...args): P };
	public modelTypes = [];

	constructor(private http: HttpClient) {}

	private getHalDocumentClass<
		T extends HalModel<P>,
		P extends Pagination,
	>(): HalDocumentConstructor<T, P> {
		return getObjProperty(this, HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY, null) || HalDocument;
	}

	public buildUrl(model?: HalModel<P>): string {
		const hostUrl: string = this.buildHostUrl(model);

		const urlParts: Array<string> = [hostUrl, model ? model.endpoint : null];

		if (model && model.id) {
			urlParts.push(model.id);
		}

		return urlParts.filter((urlPart) => urlPart).join('/');
	}

	public createHalDocument<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		rawResponse?: HttpResponse<any>,
	): HalDocument<T, P> {
		const propertyClass: ModelConstructor<T, P> = isFunction(modelClass)
			? (modelClass as ModelConstructorFn<T, P>)(rawResource)
			: (modelClass as ModelConstructor<T, P>);
		const representativeModel: T = new propertyClass({}, this);
		const halDocumentClass =
			representativeModel.getHalDocumentClass<T, P>() || this.getHalDocumentClass<T, P>();
		return new halDocumentClass(rawResource, rawResponse, propertyClass, this);
	}

	public findOne<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		modelId: string,
		includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
		customUrl?: string,
		subsequentRequestsOptions: RequestOptions = {},
	): Observable<T> {
		const url: string = customUrl || this.buildModelUrl(modelClass, modelId);

		const requestsOptions: RequestsOptions = {
			mainRequest: requestOptions,
			subsequentRequests: subsequentRequestsOptions,
		};

		const relationshipDescriptors: Array<RelationshipRequestDescriptor> =
			ensureRelationshipRequestDescriptors(includeRelationships);

		return this.handleGetRequestWithRelationships(
			url,
			requestsOptions,
			modelClass,
			true,
			relationshipDescriptors,
		);
	}

	public fetchModelRelationships<T extends HalModel<P>>(
		model: T,
		relationshipNames: RelationshipRequestDescriptor | Array<RelationshipRequestDescriptor>,
		requestOptions: RequestOptions = {},
	): Observable<T> {
		const ensuredRelationshipNames: Array<RelationshipRequestDescriptor> = [].concat(
			relationshipNames,
		);

		const relationships$: Array<Observable<any>> = this.fetchRelationships(
			model,
			ensuredRelationshipNames,
			requestOptions,
		);

		if (!relationships$.length) {
			return of(model);
		}

		return combineLatest(relationships$).pipe(map(() => model));
	}

	private fetchRelationships<T extends HalModel<P>>(
		model: T,
		relationshipDescriptors: Array<RelationshipRequestDescriptor>,
		requestOptions: RequestOptions = {}, // "global" options for all requests
	): Array<Observable<any>> {
		const relationshipCalls: Array<Observable<any>> = [];

		const relationshipMappings: RelationshipDescriptorMappings =
			this.extractCurrentLevelRelationships(relationshipDescriptors);

		for (const relationshipName in relationshipMappings) {
			const url: string = model.getRelationshipUrl(relationshipName);
			const property: ModelProperty = model.getPropertyData(relationshipName);

			if (!property) {
				continue;
			}

			let modelClass = property.propertyClass;

			if (isString(modelClass)) {
				modelClass = this.findModelClassByType(modelClass);
			}

			const isSingleResource: boolean =
				property.type === ModelPropertyEnum.Attribute || property.type === ModelPropertyEnum.HasOne;

			// Checks if the relationship is already embedded inside the embedded property, or
			// as a part of attribute properties
			const embeddedRelationship: RawHalResource = model.getEmbeddedResource(relationshipName);
			let fetchedModels: T | HalDocument<T, P>;

			if (embeddedRelationship) {
				fetchedModels = this.processRawResource(
					embeddedRelationship,
					modelClass,
					isSingleResource,
					model.rawResponse,
				);
			}

			if (!url) {
				continue;
			}

			const relationshipRequestOptions = relationshipMappings[relationshipName]
				.originalRelationshipDescriptor
				? relationshipMappings[relationshipName].originalRelationshipDescriptor.options
				: null;
			const requestsOptions: RequestsOptions = {
				mainRequest: relationshipRequestOptions || requestOptions,
				subsequentRequests: requestOptions,
			};

			const relationshipCall$: Observable<any> = this.handleGetRequestWithRelationships(
				url,
				requestsOptions,
				modelClass,
				isSingleResource,
				relationshipMappings[relationshipName].childrenRelationships,
				fetchedModels,
			).pipe(
				map((fetchedRelation) => {
					const externalRelationshipName: string = property.externalName;

					if (isHalModelInstance(model)) {
						if (property.type === ModelPropertyEnum.HasOne) {
							// The original relationship URL on the parent model must be replaced because
							// the actual relationship URL may have some query parameters attached to it
							model.links[externalRelationshipName].href = fetchedRelation.uniqueModelIdentificator;
						} else if (property.type === ModelPropertyEnum.HasMany) {
							model.updateHasManyDocumentIdentificator(
								property,
								fetchedRelation.uniqueModelIdentificator,
							);

							// In case of a HalDocument, halDocument.models may contain model instances which are not the same as the models
							// saved in local storage. That happens if the same models are fetch beforehand through another API call.
							// In that case, hasManyDocumentIdentificators of the models from HalDocument must be updated as well.
							const localModel: T = this.storage.get(model.uniqueModelIdentificator);
							if (localModel && localModel !== model) {
								localModel.updateHasManyDocumentIdentificator(
									property,
									fetchedRelation.uniqueModelIdentificator,
								);
							}
						}
					}

					return fetchedRelation;
				}),
			);

			relationshipCalls.push(relationshipCall$);
		}

		return relationshipCalls;
	}

	private extractCurrentLevelRelationships(
		relationshipDescriptors: Array<RelationshipRequestDescriptor>,
	): RelationshipDescriptorMappings {
		return relationshipDescriptors.reduce(
			(
				relationships: RelationshipDescriptorMappings,
				currentRelationshipDescriptor: RelationshipRequestDescriptor,
			) => {
				const relationshipNameParts: Array<string> = currentRelationshipDescriptor.name.split('.');
				const currentLevelRelationship: string = relationshipNameParts.shift();

				relationships[currentLevelRelationship] = relationships[currentLevelRelationship] || {
					childrenRelationships: [],
				};
				if (relationshipNameParts.length) {
					relationships[currentLevelRelationship].childrenRelationships.push({
						name: relationshipNameParts.join('.'),
						options: currentRelationshipDescriptor.options,
					});
				} else {
					relationships[currentLevelRelationship].originalRelationshipDescriptor =
						currentRelationshipDescriptor;
				}

				return relationships;
			},
			{},
		);
	}

	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: true,
		includeRelationships: Array<RelationshipRequestDescriptor>,
	): Observable<T>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: false,
		includeRelationships: Array<RelationshipRequestDescriptor>,
	): Observable<HalDocument<T, P>>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		includeRelationships: Array<RelationshipRequestDescriptor>,
	): Observable<T | HalDocument<T, P>>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: true,
		includeRelationships: Array<RelationshipRequestDescriptor>,
		fetchedModels: T | HalDocument<T, P>,
	): Observable<T>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		includeRelationships: Array<RelationshipRequestDescriptor>,
		fetchedModels: T,
	): Observable<T>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		includeRelationships: Array<RelationshipRequestDescriptor>,
		fetchedModels: HalDocument<T, P>,
	): Observable<HalDocument<T, P>>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		includeRelationships: Array<RelationshipRequestDescriptor>,
		fetchedModels: T | HalDocument<T, P>,
		storePartialModels?: boolean,
	): Observable<T | HalDocument<T, P>>;
	private handleGetRequestWithRelationships<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		includeRelationships: Array<RelationshipRequestDescriptor> = [],
		fetchedModels: T | HalDocument<T, P> = null,
		storePartialModels?: boolean,
	): Observable<T | HalDocument<T, P>> {
		let models$;

		if (fetchedModels) {
			models$ = of(fetchedModels);
		} else {
			models$ = this.makeGetRequestWrapper(
				url,
				requestsOptions,
				modelClass,
				isSingleResource,
				storePartialModels,
			);
		}

		if (includeRelationships.length) {
			return models$.pipe(
				flatMap((model: T | HalDocument<T, P>) => {
					const models: Array<T> = isSingleResource
						? ([model] as Array<T>)
						: (model as HalDocument<T, P>).models;

					const relationshipCalls: Array<Observable<any>> = this.triggerFetchingModelRelationships(
						models,
						includeRelationships,
						requestsOptions.subsequentRequests,
					);

					if (!relationshipCalls.length) {
						return of(model);
					}

					return combineLatest(relationshipCalls).pipe(map(() => model));
				}),
			);
		}

		return models$;
	}

	private makeGetRequestWrapper<T extends HalModel<P>>(
		url: string,
		requestsOptions: RequestsOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		storePartialModels?: boolean,
	): Observable<HalDocument<T, P> | T> {
		const originalGetRequest$: Observable<T | HalDocument<T, P>> = this.makeGetRequest(
			url,
			requestsOptions.mainRequest,
			modelClass,
			isSingleResource,
			storePartialModels,
		);

		if (this.storage.makeGetRequestWrapper) {
			const {
				cleanUrl,
				urlWithParams,
				requestOptions: options,
			} = this.extractRequestInfo(url, requestsOptions.mainRequest);
			const cachedResourcesFromUrl =
				this.storage.get(decodeURIComponentWithErrorHandling(url)) ||
				this.storage.get(decodeURIComponentWithErrorHandling(urlWithParams));
			return this.storage.makeGetRequestWrapper(
				{ cleanUrl, urlWithParams, originalUrl: url },
				cachedResourcesFromUrl,
				originalGetRequest$,
				options,
				modelClass,
				storePartialModels,
			);
		}

		return originalGetRequest$;
	}

	private triggerFetchingModelRelationships<T extends HalModel<P>>(
		models: Array<T>,
		includeRelationships: Array<RelationshipRequestDescriptor>,
		requestOptions?: RequestOptions,
	): Array<Observable<any>> {
		const modelRelationshipCalls: Array<Observable<any>> = [];

		models.forEach((model: T) => {
			const relationshipCalls = this.fetchRelationships(
				model,
				includeRelationships,
				requestOptions,
			);
			modelRelationshipCalls.push(...relationshipCalls);
		});

		return modelRelationshipCalls;
	}

	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
	): Observable<Array<T>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
	): Observable<Array<T>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
	): Observable<Array<T>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
	): Observable<HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
	): Observable<HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl?: string,
	): Observable<HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
	): Observable<Array<T>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: boolean,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
	): Observable<Array<T> | HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: boolean,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl: string,
	): Observable<Array<T> | HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: boolean,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl: string,
		subsequentRequestsOptions: RequestOptions,
	): Observable<Array<T> | HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl: string,
		subsequentRequestsOptions: RequestOptions,
		storePartialModels?: boolean,
	): Observable<HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl: string,
		subsequentRequestsOptions: RequestOptions,
		storePartialModels?: boolean,
	): Observable<T>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: boolean,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		customUrl: string,
		subsequentRequestsOptions: RequestOptions,
		storePartialModels?: boolean,
	): Observable<Array<T> | HalDocument<T, P>>;
	public find<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		params: object | { [param: string]: string | string[] } | HttpParams = {},
		includeMeta: boolean = false,
		includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
		customUrl?: string,
		subsequentRequestsOptions: RequestOptions = {},
		storePartialModels: boolean = false,
	): Observable<HalDocument<T, P> | Array<T>> {
		const url: string = customUrl || this.buildModelUrl(modelClass);

		const subsequentOptions: RequestOptions = deepmergeWrapper({}, subsequentRequestsOptions);

		const paramsObject: object = this.ensureParamsObject(params || {});
		requestOptions.params = this.ensureParamsObject(requestOptions.params || {});
		requestOptions.params = Object.assign(requestOptions.params, paramsObject);

		const options: RequestOptions = deepmergeWrapper({}, requestOptions);

		const requestsOptions: RequestsOptions = {
			mainRequest: options,
			subsequentRequests: subsequentOptions,
		};

		const relationshipDescriptors: Array<RelationshipRequestDescriptor> =
			ensureRelationshipRequestDescriptors(includeRelationships);

		return this.handleGetRequestWithRelationships(
			url,
			requestsOptions,
			modelClass,
			false,
			relationshipDescriptors,
			null,
			storePartialModels,
		).pipe(
			flatMap((halDocument: HalDocument<T, P>) => {
				if (relationshipDescriptors.length) {
					return of(halDocument);
				}
				return this.fetchEmbeddedListItems(
					halDocument,
					modelClass,
					relationshipDescriptors,
					subsequentOptions,
				).pipe(
					map((models: Array<T>) => {
						halDocument.models = models;
						return halDocument;
					}),
				);
			}),
			map((halDocument: HalDocument<T, P>) => (includeMeta ? halDocument : halDocument.models)),
		);
	}

	public save<T extends HalModel<P>>(
		model: T,
		modelClass: ModelConstructor<T, P>,
		requestOptions?: RequestOptions,
		saveOptions: CustomOptions<T> = {},
	): Observable<T> {
		const defaultSaveOptions: CustomOptions<T> = {
			buildUrlFunction: this.defaultUrlBuildFunction,
			specificFields: null,
			transformPayloadBeforeSave: this.defaultTransformPayloadBeforeSaveFunction,
		};

		const options: CustomOptions<T> = deepmergeWrapper(defaultSaveOptions, saveOptions);

		const url: string = options.buildUrlFunction(model, this.buildUrl(model));

		const payload = model.generatePayload({
			specificFields: options.specificFields,
			changedPropertiesOnly: false,
		});

		const transformedPayload = options.transformPayloadBeforeSave(payload);
		const modelHeaders: object = model.generateHeaders();

		const modelRequestOptions: RequestOptions = requestOptions || {};
		modelRequestOptions.headers = modelRequestOptions.headers || {};
		Object.assign(modelRequestOptions.headers, modelHeaders);

		let request$;

		if (model.isSaved) {
			request$ = this.makePutRequest(url, transformedPayload, modelRequestOptions);
		} else {
			request$ = this.makePostRequest(url, transformedPayload, modelRequestOptions);
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
			}),
		);
	}

	private updateModelWithChangedProperties<T extends HalModel<P>>(model: T, payload: unknown) {
		Object.keys(payload).forEach((externalPropertyName: string) => {
			const property: AttributeModelProperty = model.getPropertyData(externalPropertyName);

			if (
				payload[externalPropertyName] &&
				property &&
				property.type === ModelPropertyEnum.Attribute
			) {
				model['resource'][externalPropertyName] = payload[externalPropertyName];
			}
		});
	}

	public update<T extends HalModel<P>>(
		model: T,
		requestOptions?: RequestOptions,
		updateOptions: CustomOptions<T> = {},
	): Observable<T> {
		const defaultUpdateOptions: CustomOptions<T> = {
			buildUrlFunction: this.defaultUrlBuildFunction,
			specificFields: null,
			transformPayloadBeforeSave: this.defaultTransformPayloadBeforeSaveFunction,
		};

		const options: CustomOptions<T> = deepmergeWrapper(defaultUpdateOptions, updateOptions);

		const url: string = options.buildUrlFunction(model, this.buildUrl(model));
		const payload = model.generatePayload({
			specificFields: options.specificFields,
			changedPropertiesOnly: true,
		});
		const transformedPayload = options.transformPayloadBeforeSave(payload);
		const modelHeaders: object = model.generateHeaders();

		const modelRequestOptions: RequestOptions = requestOptions || {};
		modelRequestOptions.headers = modelRequestOptions.headers || {};
		Object.assign(modelRequestOptions.headers, modelHeaders);

		return this.makePatchRequest(url, transformedPayload, modelRequestOptions).pipe(
			map(() => {
				this.updateModelWithChangedProperties(model, transformedPayload);
				return model;
			}),
		);
	}

	public delete<T extends HalModel<P>>(
		model: T,
		requestOptions?: RequestOptions,
		updateOptions: CustomOptions<T> = {},
	): Observable<void> {
		const defaultUpdateOptions: CustomOptions<T> = {
			buildUrlFunction: this.defaultUrlBuildFunction,
		};

		const options: CustomOptions<T> = deepmergeWrapper(defaultUpdateOptions, updateOptions);
		const url: string = options.buildUrlFunction(model, this.buildUrl(model));

		return this.makeDeleteRequest(url, requestOptions).pipe(
			tap(() => {
				this.storage.remove(model);
			}),
		);
	}

	public get storage(): any {
		return this.internalStorage;
	}

	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: false,
	): Observable<HalDocument<T, P>>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: false,
		includeNetworkConfig: false,
	): Observable<HalDocument<T, P>>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: false,
		includeNetworkConfig: true,
	): Observable<HalDocument<T, P>>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: true,
	): Observable<T>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: boolean,
	): Observable<HalDocument<T, P> | T>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: boolean,
		includeNetworkConfig?: boolean,
	): Observable<HalDocument<T, P> | T>;
	public request<T extends HalModel<P>>(
		method: string,
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P>,
		singleResource: boolean,
		includeNetworkConfig: boolean = true,
	): Observable<HalDocument<T, P> | T> {
		const customUrl: string = includeNetworkConfig
			? `${this.buildHostUrl(new modelClass({}, this))}/${url}`
			: url;

		switch (method.toLocaleLowerCase()) {
			case 'get':
				return this.makeGetRequest(customUrl, requestOptions, modelClass, singleResource);
			default:
				throw new Error(`Method ${method} is not supported.`);
		}
	}

	private makeGetRequest<T extends HalModel<P>>(
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		singleResource: false,
	): Observable<HalDocument<T, P>>;
	private makeGetRequest<T extends HalModel<P>>(
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		singleResource: true,
	): Observable<T>;
	private makeGetRequest<T extends HalModel<P>>(
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		singleResource: boolean,
		storePartialModels?: boolean,
	): Observable<HalDocument<T, P> | T>;
	private makeGetRequest<T extends HalModel<P>>(
		url: string,
		requestOptions: RequestOptions,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		singleResource: boolean,
		storePartialModels?: boolean,
	): Observable<HalDocument<T, P> | T> {
		const {
			cleanUrl,
			requestOptions: options,
			urlWithParams,
		} = this.extractRequestInfo(url, requestOptions);

		return this.http.get<T>(cleanUrl, options as any).pipe(
			map((response: HttpResponse<T>) => {
				const rawResource: RawHalResource = this.extractResourceFromResponse(response);
				return this.processRawResource(
					rawResource,
					modelClass,
					singleResource,
					response,
					urlWithParams,
					storePartialModels,
				);
			}),
			catchError((response: HttpResponse<T>) => {
				if (response.status === 304) {
					const cachedModel: T = this.storage.get(url) || this.storage.get(response.url);

					if (cachedModel) {
						return of(cachedModel);
					}
				}

				return throwError(response);
			}),
		);
	}

	public head<T extends HalModel<P>>(url: string, requestOptions: RequestOptions): Observable<any> {
		const { cleanUrl, requestOptions: options } = this.extractRequestInfo(url, requestOptions);

		return this.http.head<T>(cleanUrl, options as any);
	}

	private extractRequestInfo(
		url: string,
		options: RequestOptions,
	): {
		cleanUrl: string;
		urlWithParams: string;
		requestOptions: RequestOptions;
	} {
		const params: object = this.ensureParamsObject(options.params || {});
		Object.assign(options, { params });
		const requestOptions: RequestOptions = deepmergeWrapper(
			DEFAULT_REQUEST_OPTIONS,
			this.networkConfig.globalRequestOptions,
			options,
		);

		this.storage.enrichRequestOptions(url, options);

		const fillParams = Object.assign({}, options.params, options.routeParams);
		const templatedUrl: string = populateTemplatedUrl(url, fillParams);

		const urlQueryParams: object = getQueryParams(templatedUrl);
		requestOptions.params = Object.assign(urlQueryParams, requestOptions.params);

		const cleanUrl: string = removeQueryParams(templatedUrl);
		const queryParamsString: string = makeQueryParamsString(requestOptions.params, true);
		const urlWithParams = queryParamsString ? `${cleanUrl}?${queryParamsString}` : cleanUrl;

		requestOptions.params = makeHttpParams(requestOptions.params, this.httpParamsOptions);

		return {
			cleanUrl,
			urlWithParams,
			requestOptions,
		};
	}

	private ensureParamsObject(
		params: HttpParams | { [param: string]: string | string[] } | object,
	): { [param: string]: string | string[] } | object {
		if (params instanceof HttpParams) {
			return params.keys().reduce((paramsObject: object, paramName: string) => {
				const arrayParam = params.getAll(paramName);
				paramsObject[paramName] = arrayParam.length > 1 ? arrayParam : params.get(paramName);
				return paramsObject;
			}, {});
		}

		return params;
	}

	private makePostRequest<T extends HalModel<P>>(
		url: string,
		payload: unknown,
		requestOptions?: RequestOptions,
	): Observable<any> {
		const { requestOptions: options, cleanUrl } = this.extractRequestInfo(
			url,
			requestOptions || {},
		);
		return this.http.post<T>(cleanUrl, payload, options as { [K: string]: any });
	}

	private makePutRequest<T extends HalModel<P>>(
		url: string,
		payload: unknown,
		requestOptions?: RequestOptions,
	): Observable<any> {
		const { requestOptions: options, cleanUrl } = this.extractRequestInfo(
			url,
			requestOptions || {},
		);
		return this.http.put<T>(cleanUrl, payload, options as { [K: string]: any });
	}

	private makePatchRequest<T extends HalModel<P>>(
		url: string,
		payload: unknown,
		requestOptions?: RequestOptions,
	): Observable<any> {
		const { requestOptions: options, cleanUrl } = this.extractRequestInfo(
			url,
			requestOptions || {},
		);
		return this.http.patch<T>(cleanUrl, payload, options as { [K: string]: any });
	}

	private makeDeleteRequest<T extends HalModel<P>>(
		url: string,
		requestOptions?: RequestOptions,
	): Observable<any> {
		const { requestOptions: options, cleanUrl } = this.extractRequestInfo(
			url,
			requestOptions || {},
		);
		return this.http.delete<T>(cleanUrl, options as { [K: string]: any });
	}

	private processRawResource<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: false,
		response: HttpResponse<T>,
	): HalDocument<T, P>;
	private processRawResource<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: true,
		response: HttpResponse<T>,
	): T;
	private processRawResource<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		response: HttpResponse<T>,
	): T | HalDocument<T, P>;
	private processRawResource<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		response: HttpResponse<T>,
		url?: string,
		savePartialModels?: boolean,
	): T | HalDocument<T, P>;
	private processRawResource<T extends HalModel<P>>(
		rawResource: RawHalResource,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		isSingleResource: boolean,
		response: HttpResponse<T>,
		url?: string,
		savePartialModels?: boolean,
	): T | HalDocument<T, P> {
		if (isSingleResource) {
			const propertyClass: ModelConstructor<T, P> = isFunction(modelClass)
				? (modelClass as ModelConstructorFn<T, P>)(rawResource)
				: (modelClass as ModelConstructor<T, P>);
			const model: T = new propertyClass(rawResource, this, response);
			this.populateResourceWithRelationshipIdentificators(model);
			this.storage.save(model, response, [url]);
			return model;
		}

		const halDocument: HalDocument<T, P> = this.createHalDocument(
			rawResource,
			modelClass,
			response,
		);

		this.storage.saveAll(halDocument.models, savePartialModels);

		halDocument.models.forEach((listModel: T) => {
			this.populateResourceWithRelationshipIdentificators(listModel);
		});

		this.storage.save(halDocument, response, [url]);
		return halDocument;
	}

	private buildModelUrl(modelClass: ModelConstructor<HalModel<P>, P>, modelId?: string): string {
		const model = new modelClass({}, this);

		if (modelId && model.modelEndpoints?.singleResourceEndpoint) {
			return model.modelEndpoints.singleResourceEndpoint;
		} else if (!modelId && model.modelEndpoints?.collectionEndpoint) {
			return model.modelEndpoints.collectionEndpoint;
		}

		const modelUrl: string = this.buildUrl(model);
		return modelId ? `${modelUrl}/${modelId}` : modelUrl;
	}

	private extractResourceFromResponse(response: HttpResponse<object>): RawHalResource {
		return response.body;
	}

	private populateResourceWithRelationshipIdentificators<T extends HalModel<P>>(model: T): void {
		const localResource: T = this.storage.get(model.uniqueModelIdentificator);
		if (localResource) {
			model.hasManyDocumentIdentificators = localResource.hasManyDocumentIdentificators;
		}
	}

	private fetchEmbeddedListItems<T extends HalModel<P>>(
		halDocument: HalDocument<T, P>,
		modelClass: ModelConstructor<T, P> | ModelConstructorFn<T, P>,
		includeRelationships: Array<RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
	): Observable<Array<T>> {
		const modelCalls: Array<Observable<T>> = [];

		const requestsOptions: RequestsOptions = {
			mainRequest: requestOptions,
			subsequentRequests: requestOptions,
		};

		// Don't fetch list items if they are embedded
		if (halDocument.hasEmbeddedItems) {
			halDocument.models.forEach((model: T) => {
				const call$ = this.handleGetRequestWithRelationships(
					null,
					requestsOptions,
					modelClass,
					true,
					includeRelationships,
					model,
				);
				modelCalls.push(call$);
			});
		} else {
			halDocument.itemLinks.forEach((link: RawHalLink) => {
				const url: string = link.href;

				if (url) {
					const call$ = this.handleGetRequestWithRelationships(
						url,
						requestsOptions,
						modelClass,
						true,
						includeRelationships,
					);
					modelCalls.push(call$);
				}
			});
		}

		if (!modelCalls.length) {
			return of([]);
		}

		return combineLatest(modelCalls);
	}

	private buildHostUrl(model?: HalModel<P>): string {
		const baseUrl: string =
			model && model.networkConfig && model.networkConfig.baseUrl
				? model.networkConfig.baseUrl
				: this.networkConfig.baseUrl;
		const networkEndpoint: string =
			model && model.networkConfig && model.networkConfig.endpoint
				? model.networkConfig.endpoint
				: this.networkConfig.endpoint;

		return [baseUrl, networkEndpoint].filter((urlPart) => urlPart).join('/');
	}

	private defaultUrlBuildFunction<T extends HalModel<P>>(model: T, urlFromModel: string): string {
		if (model.isSaved && model.selfLink) {
			return model.selfLink;
		}

		if (model.id && model.modelEndpoints?.singleResourceEndpoint) {
			return model.modelEndpoints.singleResourceEndpoint;
		} else if (!model.id && model.modelEndpoints?.collectionEndpoint) {
			return model.modelEndpoints.collectionEndpoint;
		}

		return urlFromModel;
	}

	private defaultTransformPayloadBeforeSaveFunction(payload: object): object {
		return payload;
	}

	private get cacheStrategy(): CacheStrategy {
		return this._cacheStrategy;
	}

	private get halStorage(): HalStorage<P> {
		return this._storage;
	}

	public findModelClassByType<T extends HalModel<P>>(modelType: string): ModelConstructor<T, P> {
		const modelClass: ModelConstructor<T, P> = this.modelTypes.find(
			(modelClass) => modelClass.modelType === modelType,
		);

		if (!modelClass) {
			throw new Error(
				`Provided model name "${modelType}" cannot be found in the Datastore. Provide it in DatastoreService.modelTypes`,
			);
		}

		return modelClass;
	}

	public createModel<T extends HalModel<P>>(
		modelClass: ModelConstructor<T, P>,
		recordData: object = {},
	): T {
		const rawRecordData: object = Object.assign({}, recordData);
		rawRecordData[EMBEDDED_PROPERTY_NAME] = Object.assign(
			{},
			recordData,
			recordData[EMBEDDED_PROPERTY_NAME],
		);
		const model: T = new modelClass(rawRecordData, this);
		return model;
	}
}
