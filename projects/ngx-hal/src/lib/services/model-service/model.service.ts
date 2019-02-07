import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { Observable } from 'rxjs';

export class ModelService<Model extends HalModel> {
  constructor(private datastore: DatastoreService, private modelClass: { new(): Model } ) {}

  public get(modelId, options): Observable<any> {
    const model: Model = new this.modelClass();

    const url = `${this.datastore.buildUrl()}/${model.endpoint}`;

    return this.datastore.http.get<Model>(url, options).pipe((x) => {
      return x;
    });
  }
}
