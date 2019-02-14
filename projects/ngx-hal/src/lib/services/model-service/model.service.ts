import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';
import { EMBEDDED_PROPERTY_NAME, LINKS_PROPERTY_NAME } from '../../constants/hal.constant';
import { isArray } from '../../utils/isArray/is-array.util';

type TodoType = any;

export class ModelService<Model extends HalModel> {
  constructor(private datastore: DatastoreService, private modelClass: {new(...args): Model }) {}

  public findOne(modelId: string, options: TodoType): Observable<Model> {
    const url: string = this.buildModelUrl(modelId);

    options.observe = 'response'; // TODO handle options

    return this.datastore.http.get<Model>(url, options).pipe(
      map((response: HttpResponse<Model>) => {
        return new this.modelClass(this.extractResourceFromResponse(response), response);
      })
    );
  }

  // TODO if meta is included, returning type should be Observable<SmethingWithMeta>
  public find(options: TodoType): Observable<Array<Model>> {
    const url: string = this.buildModelUrl();

    options.observe = 'response'; // TODO handle options

    return this.datastore.http.get<Model>(url, options).pipe(
      map((response: HttpResponse<Model>) => {
        const resources: RawHalResource = this.extractResourceFromResponse(response);
        const listPropertyName: string = this.getListPropertyName(resources);

        const items = resources[EMBEDDED_PROPERTY_NAME][listPropertyName];

        if (items) {
          return items.map((resource: RawHalResource) => {
            return new this.modelClass(resource, resource);
          });
        }

        return [];
      })
    );
  }

  private buildModelUrl(modelId?: string): string {
    const modelUrl: string = this.datastore.buildUrl(this.representableModel);
    return modelId ? `${modelUrl}/${modelId}` : modelUrl;
  }

  private get representableModel(): Model {
    return new this.modelClass();
  }

  private extractResourceFromResponse(response: HttpResponse<object>): RawHalResource {
    return response.body;
  }

  private getListPropertyName(listResponse: RawHalResource): string {
    const links = listResponse[LINKS_PROPERTY_NAME];

    return Object.keys(links).find((propertyName: string) => {
      return isArray(links[propertyName]);
    });
  }
}
