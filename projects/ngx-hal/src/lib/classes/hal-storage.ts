import { HalModel } from '../models/hal.model';
import { HalDocument } from './hal-document';

export class HalStorage {
  private internalStorage: { [K: string]: any } = {};

  public save(model: HalModel): void {
    this.internalStorage[model.uniqueModelIdentificator] = model;
  }

  public saveAll(models: Array<HalModel>): void {
    models.forEach((model) => {
      this.internalStorage[model.uniqueModelIdentificator] = model;
    });
  }

  public saveHalDocument<T extends HalModel>(halDocument: HalDocument<T>): void {
    this.internalStorage[halDocument.uniqueModelIdentificator] = halDocument;
  }

  public get(uniqueModelIdentificator: string): HalModel | HalDocument<HalModel> {
    return this.internalStorage[uniqueModelIdentificator];
  }

  public remove(model: HalModel): void {
    delete this.internalStorage[model.uniqueModelIdentificator];
  }
}
