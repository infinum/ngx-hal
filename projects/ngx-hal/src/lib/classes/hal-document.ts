import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { LINKS_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME, SELF_PROPERTY_NAME } from '../constants/hal.constant';
import { HalModel } from '../models/hal.model';
import { Pagination } from './pagination';
import { ModelConstructor } from '../types/model-constructor.type';
import { DatastoreService } from '../services/datastore/datastore.service';
import { isArray } from '../utils/is-array/is-array.util';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';
import { removeQueryParams } from '../utils/remove-query-params/remove-query-params.util';
import { RequestOptions } from '../types/request-options.type';

export class HalDocument<T extends HalModel> {
  public models: Array<T>;
  public pagination: Pagination;

  constructor(
    private rawResource: RawHalResource,
    private rawResponse: HttpResponse<any>,
    private modelClass: ModelConstructor<T>,
    private datastore: DatastoreService
  ) {
    this.parseRawResources(rawResource);
  }

  public get uniqueModelIdentificator(): string {
    return this.links[SELF_PROPERTY_NAME].href;
  }

  public get hasEmbeddedItems(): boolean {
    const listPropertyName: string = this.getListPropertyName(this.rawResource);
    return this.rawResource[EMBEDDED_PROPERTY_NAME] && this.rawResource[EMBEDDED_PROPERTY_NAME][listPropertyName];
  }

  public get itemLinks(): Array<RawHalLink> {
    const listPropertyName: string = this.getListPropertyName(this.rawResource);
    return (this.links[listPropertyName] as any) || [];
  }

  public getPage(pageNumber: number, requestOptions: RequestOptions = {}): Observable<HalDocument<T>> {
    requestOptions.params = requestOptions.params || {};

    if (pageNumber || pageNumber === 0) {
      requestOptions.params['page'] = pageNumber;
    }

    const relationshipUrl: string = this.links[SELF_PROPERTY_NAME].href;

    return this.datastore.request('GET', relationshipUrl, requestOptions, this.modelClass, false, false);
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

    return Object.keys(links).find((propertyName: string) => {
      return isArray(links[propertyName]);
    }) || 'item'; // TODO defaults to the `item`, check if this should be defaulted
  }

  private get links(): RawHalLinks {
    return this.rawResource[LINKS_PROPERTY_NAME];
  }
}
