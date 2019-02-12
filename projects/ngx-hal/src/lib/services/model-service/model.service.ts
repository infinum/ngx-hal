import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';

type TodoType = any;

export class ModelService<Model extends HalModel> {
  constructor(private datastore: DatastoreService, private modelClass: { new(...args): Model } ) {}

  public findOne(modelId: string, options: TodoType): Observable<TodoType> {
    const url: string = this.buildModelUrl(modelId);

    options.observe = 'response'; // TODO handle options

    return this.datastore.http.get<Model>(url, options).pipe(
      map((response: HttpResponse<Model>) => {
        return new this.modelClass(this.extractResourceFromResponse(response), response);
      })
    );
  }

  public find(options: TodoType): Observable<TodoType> {
    const url: string = this.buildModelUrl();
    return this.datastore.http.get<Model>(url, options);
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
}
