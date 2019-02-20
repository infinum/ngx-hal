import { HttpResponse } from '@angular/common/http';
import { isArray } from 'util';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { LINKS_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { HalModel } from '../models/hal.model';
import { Pagination } from './pagination';

export class HalDocument<Model extends HalModel> {
  public models: Array<Model>;
  public pagination: Pagination;

  constructor(rawResponse: HttpResponse<any>, private modelClass: {new(...args): Model }) {
    const resources: RawHalResource = this.extractResponseBody(rawResponse);
    this.parseRawResources(resources);
  }

  private parseRawResources(resources: RawHalResource): void {
    const items: Array<RawHalResource> = this.getRawResourcesFromResponse(resources);
    this.models = this.generateModels(items);
    this.pagination = this.generatePagination(resources);
  }

  private extractResponseBody(response: HttpResponse<object>): RawHalResource {
    return response.body;
  }

  private generateModels(resources: Array<RawHalResource>): Array<Model> {
    return resources.map((resource: RawHalResource) => {
      return new this.modelClass(resource, resource);
    });
  }

  private generatePagination(pagination: RawHalResource): Pagination {
    return new Pagination(pagination);
  }

  private getRawResourcesFromResponse(resources: RawHalResource): Array<RawHalResource> {
    const listPropertyName: string = this.getListPropertyName(resources);
    return resources[EMBEDDED_PROPERTY_NAME][listPropertyName] || [];
  }

  private getListPropertyName(listResponse: RawHalResource): string {
    const links = listResponse[LINKS_PROPERTY_NAME];

    return Object.keys(links).find((propertyName: string) => {
      return isArray(links[propertyName]);
    });
  }
}
