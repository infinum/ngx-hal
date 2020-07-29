import { HttpResponse } from '@angular/common/http';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HalStorage } from './hal-storage';

export class SimpleHalStorage extends HalStorage {
  public save<T extends HalModel>(
    model: T | HalDocument<T>,
    response?: HttpResponse<T>,
    alternateUniqueIdentificators: Array<string> = []
  ): void {
    const identificators: Array<string> = [].concat(alternateUniqueIdentificators);
    identificators.push(model.uniqueModelIdentificator);

    identificators.filter(Boolean).forEach((identificator: string) => {
      this.internalStorage[identificator] = model;
    });
  }

  public get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T> {
    return this.internalStorage[uniqueModelIdentificator];
  }
}
