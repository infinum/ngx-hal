import { HalModel } from '../models/hal.model';

export class HalStorage {
  private internalStorage: { [K: string]: any } = {};

  public save(model: HalModel): void {
    const name: string = model.constructor.name;

    this.internalStorage[name] = this.internalStorage[name] || {};
    this.internalStorage[name][model.uniqueModelIdentificator] = model;
  }

  public saveAll(models: Array<HalModel>): void {
    const name: string = models[0].constructor.name;

    this.internalStorage[name] = this.internalStorage[name] || {};

    models.forEach((model) => {
      this.internalStorage[name][model.uniqueModelIdentificator] = model;
    });
  }
}
