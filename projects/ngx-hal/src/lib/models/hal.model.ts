import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { ATTRIBUTE_PROPERTIES_METADATA_KEY, HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { ModelProperty } from '../interfaces/model-property.interface';
import { LINKS_PROPERTY_NAME, SELF_PROPERTY_NAME } from '../constants/hal.constant';


export abstract class HalModel {
  private config: ModelOptions = this.config || DEFAULT_MODEL_OPTIONS;

  constructor(private resource: RawHalResource = {}, private rawResponse?: HttpResponse<object>) {
    this.parseAttributes(resource);
  }

  public get uniqueModelIdentificator(): string {
    const selfLink = this.resource[LINKS_PROPERTY_NAME][SELF_PROPERTY_NAME].href;
    return selfLink.split('/').pop();
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  public getHalDocumentClass<T extends this>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, this.constructor);
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
