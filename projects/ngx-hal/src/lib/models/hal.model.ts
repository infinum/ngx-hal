import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../interfaces/model-property.interface';

export abstract class HalModel {
  private config: ModelOptions = DEFAULT_MODEL_OPTIONS;

  constructor(resource: RawHalResource = {}, private rawResponse?: HttpResponse<object>) {
    this.parseAttributes(resource);
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  private get attributePropertyNames(): Array<ModelProperty> {
    return Reflect.getMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, this.constructor) || [];
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributePropertyNames.forEach((attributeProperty: ModelProperty) => {
      const rawPropertyValue: any = resource[attributeProperty.name];

      // tslint:disable-next-line:max-line-length
      this[attributeProperty.name] = attributeProperty.propertyClass ? new attributeProperty.propertyClass(rawPropertyValue) : rawPropertyValue;
    });
  }
}
