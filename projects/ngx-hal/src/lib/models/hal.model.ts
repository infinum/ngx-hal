import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import {
  ATTRIBUTE_PROPERTIES_METADATA_KEY,
  HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY,
  HAS_ONE_PROPERTIES_METADATA_KEY
} from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { ModelProperty } from '../interfaces/model-property.interface';
import { LINKS_PROPERTY_NAME, SELF_PROPERTY_NAME } from '../constants/hal.constant';
import { DatastoreService } from '../services/datastore/datastore.service';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';


export abstract class HalModel {
  private config: ModelOptions = this.config || DEFAULT_MODEL_OPTIONS;

  constructor(
    private resource: RawHalResource = {},
    private datastore: DatastoreService,
    private rawResponse?: HttpResponse<object>
  ) {
    this.parseAttributes(resource);
    this.createHasOneGetters();
  }

  public get uniqueModelIdentificator(): string {
    return this.resource[LINKS_PROPERTY_NAME][SELF_PROPERTY_NAME].href;
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  public getHalDocumentClass<T extends this>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, this.constructor);
  }

  private get attributePropertyNames(): Array<ModelProperty> {
    return Reflect.getMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get hasOnePropertyNames(): Array<ModelProperty> {
    return Reflect.getMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private createHasOneGetters(): void {
    this.hasOnePropertyNames.forEach((property: ModelProperty) => {
      Object.defineProperty(HalModel.prototype, property.name, {
        get: () => {
          const relationshipLinks: RawHalLink = this.rawResponse[LINKS_PROPERTY_NAME][property.name];

          if (!relationshipLinks) {
            return;
          }

          const modelIdentificator: string = relationshipLinks.href;
          return this.datastore.storage.get(modelIdentificator);
        }
      });
    });
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributePropertyNames.forEach((attributeProperty: ModelProperty) => {
      const rawPropertyValue: any = resource[attributeProperty.name];

      // tslint:disable-next-line:max-line-length
      this[attributeProperty.name] = attributeProperty.propertyClass ? new attributeProperty.propertyClass(rawPropertyValue) : rawPropertyValue;
    });
  }
}
