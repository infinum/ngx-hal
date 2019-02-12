import { Observable } from 'rxjs';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';

type TodoType = any;

export class ModelService<Model extends HalModel> {
  constructor(private datastore: DatastoreService, private modelClass: { new(): Model } ) {}

  public findOne(modelId: string, options: TodoType): Observable<TodoType> {
    const url: string = this.buildModelUrl(modelId);
    return this.datastore.http.get<Model>(url, options);
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
}
