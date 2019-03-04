import { HalModel } from '../models/hal.model';

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

  public get(uniqueModelIdentificator: string): void {
    return this.internalStorage[uniqueModelIdentificator];
  }
}
