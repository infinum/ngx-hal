import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HalModel } from '../../models/hal.model';
import { DatastoreService } from '../datastore/datastore.service';
import { RawHalResource } from '../../interfaces/raw-hal-resource.interface';
import { RequestOptions } from '../../types/request-options.type';
import { DEFAULT_REQUEST_OPTIONS } from '../../constants/request.constant';
import { HalDocument } from '../../classes/hal-document';
import { ModelConstructor } from '../../types/model-constructor.type';

export class ModelService<Model extends HalModel> {
  constructor(protected datastore: DatastoreService, private modelClass: ModelConstructor<Model>) {}

  public findOne(modelId: string, requestOptions: RequestOptions = {}): Observable<Model> {
    const url: string = this.buildModelUrl(modelId);

    const options = Object.assign(DEFAULT_REQUEST_OPTIONS, requestOptions);

    return this.datastore.http.get<Model>(url, options).pipe(
      map((response: HttpResponse<Model>) => {
        return this.createModel(this.extractResourceFromResponse(response), response);
      })
    );
  }

  public find(params: object): Observable<Array<Model>>;
  public find(params: object, includeMeta: boolean): Observable<Array<Model>>;
  public find(params: object, includeMeta: boolean, requestOptions: RequestOptions): Observable<HalDocument<Model>>;
  public find(
    params: object = {},
    includeMeta: boolean = false,
    requestOptions: RequestOptions = {}
  ): Observable<HalDocument<Model>> | Observable<Array<Model>> {
    const url: string = this.buildModelUrl();

    const options = Object.assign({}, DEFAULT_REQUEST_OPTIONS, requestOptions);
    Object.assign(options.params, params);

    if (includeMeta) {
      return this.datastore.http.get<Model>(url, options).pipe(
        map((response: HttpResponse<Model>) => {
          const halDocument: HalDocument<Model> = this.createHalDocument(response);
          return halDocument;
        })
      );
    }

    return this.datastore.http.get<Model>(url, options).pipe(
      map((response: HttpResponse<Model>) => {
        const halDocument: HalDocument<Model> = this.createHalDocument(response);
        return halDocument.models;
      })
    );
  }

  public createNewModel(recordData: object = {}): Model {
    return this.createModel(recordData);
  }

  private createModel(recordData: object = {}, response?: HttpResponse<object>): Model {
    return new this.modelClass(recordData, response);
  }

  private createHalDocument(response: HttpResponse<Model>): HalDocument<Model> {
    return this.datastore.createHalDocument<Model>(response, this.modelClass);
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
