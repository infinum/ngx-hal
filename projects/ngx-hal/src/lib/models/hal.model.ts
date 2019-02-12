import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';

export abstract class HalModel {
  private config: ModelOptions = DEFAULT_MODEL_OPTIONS;

  constructor(data: RawHalResource = {}, private rawResponse?: HttpResponse<object>) {
    console.log(data);
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }
}
