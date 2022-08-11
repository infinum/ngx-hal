import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import {
	LINKS_PROPERTY_NAME,
	EMBEDDED_PROPERTY_NAME,
	SELF_PROPERTY_NAME,
} from '../constants/hal.constant';
import { HalModel } from '../models/hal.model';
import { Pagination } from './pagination';
import { ModelConstructor } from '../types/model-constructor.type';
import { DatastoreService } from '../services/datastore/datastore.service';
import { isArray } from '../utils/is-array/is-array.util';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';
import { RequestOptions } from '../types/request-options.type';
import { RelationshipRequestDescriptor } from '../types/relationship-request-descriptor.type';
import { generateUUID } from '../helpers/uuid/uuid.helper';

export class HalDocument<T extends HalModel> {
	public models: Array<T>;
	public pagination: Pagination;
	public uniqueModelIdentificator: string;

	constructor(
		private rawResource: RawHalResource,
		private rawResponse: HttpResponse<any>,
		private modelClass: ModelConstructor<T>,
		private datastore: DatastoreService,
	) {
		this.parseRawResources(rawResource);
		this.generateUniqueModelIdentificator();
	}

	public get hasEmbeddedItems(): boolean {
		const listPropertyName: string = this.getListPropertyName(this.rawResource);
		return (
			this.rawResource[EMBEDDED_PROPERTY_NAME] &&
			this.rawResource[EMBEDDED_PROPERTY_NAME][listPropertyName]
		);
	}

	public get itemLinks(): Array<RawHalLink> {
		const listPropertyName: string = this.getListPropertyName(this.rawResource);
		return (this.links[listPropertyName] as any) || [];
	}

	public getPage(
		pageNumber: number,
		includeRelationships: Array<string | RelationshipRequestDescriptor> = [],
		requestOptions: RequestOptions = {},
		subsequentRequestsOptions: RequestOptions = {},
	): Observable<HalDocument<T>> {
		requestOptions.params = requestOptions.params || {};

		if (pageNumber || pageNumber === 0) {
			requestOptions.params['page'] = pageNumber;
		}

		const relationshipUrl: string = this.links[SELF_PROPERTY_NAME].href;

		return this.datastore.find(
			this.modelClass,
			{},
			true,
			includeRelationships,
			requestOptions,
			relationshipUrl,
			subsequentRequestsOptions,
		);
	}

	private parseRawResources(resources: RawHalResource): void {
		const items: Array<RawHalResource> = this.getRawResourcesFromResponse(resources);
		this.models = this.generateModels(items);
		this.pagination = this.generatePagination(resources);
	}

	private generateModels(resources: Array<RawHalResource>): Array<T> {
		return resources.map((resource: RawHalResource) => {
			return new this.modelClass(resource, this.datastore, this.rawResponse);
		});
	}

	private generatePagination(pagination: RawHalResource): Pagination {
		if (!this.datastore.paginationClass) {
			return null;
		}

		return new this.datastore.paginationClass(pagination);
	}

	private getRawResourcesFromResponse(resources: RawHalResource): Array<RawHalResource> {
		const listPropertyName: string = this.getListPropertyName(resources);

		if (!resources[EMBEDDED_PROPERTY_NAME]) {
			return [];
		}

		return resources[EMBEDDED_PROPERTY_NAME][listPropertyName] || [];
	}

	private getListPropertyName(listResponse: RawHalResource): string {
		const links = listResponse[LINKS_PROPERTY_NAME];

		const embdedded: object = this.rawResource[EMBEDDED_PROPERTY_NAME];
		const fallbackListPropertyName = embdedded
			? Object.keys(embdedded)[0]
			: 'noListPropertyPresent';

		return (
			Object.keys(links || {}).find((propertyName: string) => {
				return isArray(links[propertyName]);
			}) || fallbackListPropertyName
		);
	}

	public get selfLink(): string {
		return this.links && this.links[SELF_PROPERTY_NAME]
			? this.links[SELF_PROPERTY_NAME].href
			: null;
	}

	private get links(): RawHalLinks {
		return this.rawResource[LINKS_PROPERTY_NAME];
	}

	private generateUniqueModelIdentificator(): void {
		this.uniqueModelIdentificator = generateUUID();
	}
}
