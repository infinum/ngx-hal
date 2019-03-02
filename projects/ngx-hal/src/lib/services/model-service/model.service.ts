import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RequestOptions } from '../../types/request-options.type';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';

export abstract class ModelService<Model extends HalModel> {
  constructor(protected datastore: DatastoreService, private modelClass: ModelConstructor<Model>) {}

  public findOne(modelId: string, requestOptions: RequestOptions = {}): Observable<Model> {
    return this.datastore.findOne<Model>(this.modelClass, modelId, requestOptions);
  }

  public find(params: object): Observable<Array<Model>>;
  public find(params: object, includeMeta: boolean): Observable<Array<Model>>;
  public find(params: object, includeMeta: boolean, requestOptions: RequestOptions): Observable<HalDocument<Model>>;
  public find(
    params: object = {},
    includeMeta: boolean = false,
    requestOptions: RequestOptions = {}
  ): Observable<HalDocument<Model>> | Observable<Array<Model>> {
    return this.datastore.find(this.modelClass, params, includeMeta, requestOptions);
  }

  public createNewModel(recordData: object = {}): Model {
    return this.createModel(recordData);
  }

  private createModel(recordData: object = {}, response?: HttpResponse<object>): Model {
    return new this.modelClass(recordData, this.datastore, response);
  }
}
