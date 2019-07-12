import { HttpResponse } from '@angular/common/http';
import { HalModel } from '../models/hal.model';
import { HalDocument } from '../classes/hal-document';

export interface HalStorage {
  save<T extends HalModel>(model: T, response?: HttpResponse<T>): void;
  saveAll<T extends HalModel>(models: Array<T>, response?: HttpResponse<T>): void;
  saveHalDocument<T extends HalModel>(halDocument: HalDocument<T>, response?: HttpResponse<T>): void;
  get(uniqueModelIdentificator: string): HalModel | HalDocument<HalModel>;
  remove(model: HalModel): void;
}
