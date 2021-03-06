import { HalModel } from '../../models/hal.model';
import { HalDocument } from './../hal-document';
import { HttpResponse } from '@angular/common/http';
import { RequestOptions } from '../../types/request-options.type';

export abstract class HalStorage {
  protected internalStorage: { [K: string]: any } = {};

  public abstract save<T extends HalModel>(
    model: T | HalDocument<T>,
    response?: HttpResponse<T>,
    alternateUniqueIdentificators?: Array<string>
  ): void;

  public abstract get<T extends HalModel>(uniqueModelIdentificator: string): T | HalDocument<T>;

  public saveAll<T extends HalModel>(models: Array<T>, savePartialModels: boolean = false): void {
    models.forEach((model: T) => {
      if (savePartialModels || !this.get(model.uniqueModelIdentificator)) {
        this.save(model);
      }
    });
  }

  public remove(model: HalModel): void {
    delete this.internalStorage[model.uniqueModelIdentificator];
  }

  public enrichRequestOptions(uniqueModelIdentificator: string, requestOptions: RequestOptions): void {
    // noop
  }
}
