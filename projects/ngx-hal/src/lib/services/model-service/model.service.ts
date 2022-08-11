import { HttpResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RequestOptions } from '../../types/request-options.type';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';
import { RelationshipRequestDescriptor } from '../../types/relationship-request-descriptor.type';

export abstract class ModelService<Model extends HalModel> {
	constructor(protected datastore: DatastoreService, private modelClass: ModelConstructor<Model>) {}

	public findOne(
		modelId: string,
		includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
		subsequentRequestsOptions: RequestOptions = {},
	): Observable<Model> {
		return this.datastore.findOne<Model>(
			this.modelClass,
			modelId,
			includeRelationships,
			requestOptions,
			undefined,
			subsequentRequestsOptions,
		);
	}

	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
	): Observable<Array<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
	): Observable<Array<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
	): Observable<HalDocument<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
	): Observable<Array<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
	): Observable<HalDocument<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
	): Observable<Array<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
	): Observable<HalDocument<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: true,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		subsequentRequestsOptions: RequestOptions,
		customUrl?: string,
		storePartialModels?: boolean,
	): Observable<HalDocument<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams,
		includeMeta: false,
		includeRelationships: Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions,
		subsequentRequestsOptions: RequestOptions,
		customUrl?: string,
		storePartialModels?: boolean,
	): Observable<Array<Model>>;
	public find(
		params: object | { [param: string]: string | string[] } | HttpParams = {},
		includeMeta: boolean = false,
		includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
		subsequentRequestsOptions: RequestOptions = {},
		customUrl?: string,
		storePartialModels?: boolean,
	): Observable<HalDocument<Model> | Array<Model>> {
		return this.datastore.find(
			this.modelClass,
			params,
			includeMeta,
			includeRelationships,
			requestOptions,
			customUrl,
			subsequentRequestsOptions,
			storePartialModels,
		);
	}

	public createNewModel(recordData: object = {}): Model {
		const model: Model = this.datastore.createModel(this.modelClass, recordData);
		this.datastore.storage.save(model);
		return model;
	}
}
