import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HalStorage } from './hal-storage';

export class SimpleHalStorage extends HalStorage {
  public save<T extends HalModel>(model: T | HalDocument<T>): void {
    this.internalStorage[model.uniqueModelIdentificator] = model;
  }

  public get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T> {
    return this.internalStorage[uniqueModelIdentificator];
  }
}
