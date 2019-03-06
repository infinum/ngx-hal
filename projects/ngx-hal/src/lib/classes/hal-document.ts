import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { LINKS_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { HalModel } from '../models/hal.model';
import { Pagination } from './pagination';
import { ModelConstructor } from '../types/model-constructor.type';
import { DatastoreService } from '../services/datastore/datastore.service';
import { isArray } from '../utils/isArray/is-array.util';

export class HalDocument<Model extends HalModel> {
  public models: Array<Model>;
  public pagination: Pagination;

  constructor(
    rawResponse: RawHalResource,
    private modelClass: ModelConstructor<Model>,
    private datastore: DatastoreService
  ) {
    this.parseRawResources(rawResponse);
  }

  private parseRawResources(resources: RawHalResource): void {
    const items: Array<RawHalResource> = this.getRawResourcesFromResponse(resources);
    this.models = this.generateModels(items);
    this.pagination = this.generatePagination(resources);
  }

  private generateModels(resources: Array<RawHalResource>): Array<Model> {
    return resources.map((resource: RawHalResource) => {
      return new this.modelClass(resource, this.datastore, resource);
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
