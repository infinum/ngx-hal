import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { metadataConstants } from '../constants/metadata.constants';

export abstract class HalModel {
  private config: ModelOptions = DEFAULT_MODEL_OPTIONS;

  constructor(resource: RawHalResource = {}, private rawResponse?: HttpResponse<object>) {
    this.parseAttributes(resource);
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  private get attributePropertyNames(): Array<string> {
    return Reflect.getMetadata(metadataConstants.attributePropertyNames, this) || [];
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributePropertyNames.forEach((attributeName: string) => {
      this[attributeName] = resource[attributeName];
    });
  }
}
