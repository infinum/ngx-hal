import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HttpResponse } from '@angular/common/http';
import { HalStorage } from '../../interfaces/hal-storage.interface';

interface StorageModel<T extends HalModel> {
  model: T | HalDocument<T>;
}

export class EtagHalStorage implements HalStorage {
  private internalStorage: { [K: string]: StorageModel<any> } = {};

  public save<T extends HalModel>(model: T, response?: HttpResponse<T>): void {
    this.internalStorage[model.uniqueModelIdentificator] = {
      model
    };
  }

  public saveAll<T extends HalModel>(models: Array<T>, response?: HttpResponse<T>): void {
    models.forEach((model) => {
      this.internalStorage[model.uniqueModelIdentificator] = {
        model
      };
    });
  }

  public saveHalDocument<T extends HalModel>(halDocument: HalDocument<T>, response?: HttpResponse<T>): void {
    this.internalStorage[halDocument.uniqueModelIdentificator] = {
      model: halDocument
    };
  }

  public get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T> {
    return this.internalStorage[uniqueModelIdentificator].model;
  }

  public remove(model: HalModel): void {
    delete this.internalStorage[model.uniqueModelIdentificator];
  }
}
