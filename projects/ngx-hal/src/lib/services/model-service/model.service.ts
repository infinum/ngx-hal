import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RequestOptions } from '../../types/request-options.type';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';

export abstract class ModelService<Model extends HalModel> {
  constructor(protected datastore: DatastoreService, private modelClass: ModelConstructor<Model>) {}

  public findOne(
    modelId: string,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {},
    subsequentRequestsOptions: RequestOptions = {}
  ): Observable<Model> {
    return this.datastore.findOne<Model>(
      this.modelClass,
      modelId,
      includeRelationships,
      requestOptions,
      undefined,
      subsequentRequestsOptions
    );
  }

  public find(params: object): Observable<Array<Model>>;
  public find(params: object, includeMeta: false): Observable<Array<Model>>;
  public find(params: object, includeMeta: true): Observable<HalDocument<Model>>;
  public find(params: object, includeMeta: false, includeRelationships: Array<string>): Observable<Array<Model>>;
  public find(params: object, includeMeta: true, includeRelationships: Array<string>): Observable<HalDocument<Model>>;
  public find(
    params: object,
    includeMeta: false,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<Array<Model>>;
  public find(
    params: object,
    includeMeta: true,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions
  ): Observable<HalDocument<Model>>;
  public find(
    params: object,
    includeMeta: true,
    includeRelationships: Array<string>,
    requestOptions: RequestOptions,
    subsequentRequestsOptions: RequestOptions
  ): Observable<HalDocument<Model>>;
  public find(
    params: object = {},
    includeMeta: boolean = false,
    includeRelationships: Array<string> = [],
    requestOptions: RequestOptions = {},
    subsequentRequestsOptions: RequestOptions = {}
  ): Observable<HalDocument<Model> | Array<Model>> {
    return this.datastore.find(
      this.modelClass,
      params,
      includeMeta,
      includeRelationships,
      requestOptions,
      undefined,
      subsequentRequestsOptions
    );
  }

  public createNewModel(recordData: object = {}): Model {
    const model: Model = this.createModel(recordData);
    this.datastore.storage.save(model);
    return model;
  }

  private createModel(recordData: object = {}, response?: HttpResponse<object>): Model {
    return new this.modelClass(recordData, this.datastore, response);
  }
}
