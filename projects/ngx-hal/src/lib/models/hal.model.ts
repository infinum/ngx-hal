import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import {
  ATTRIBUTE_PROPERTIES_METADATA_KEY,
  HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY,
  HAS_ONE_PROPERTIES_METADATA_KEY,
  HAS_MANY_PROPERTIES_METADATA_KEY
} from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { ModelProperty } from '../interfaces/model-property.interface';
import { LINKS_PROPERTY_NAME, SELF_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { DatastoreService } from '../services/datastore/datastore.service';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';


export abstract class HalModel {
  private config: ModelOptions = this.config || DEFAULT_MODEL_OPTIONS;

  constructor(
    private resource: RawHalResource = {},
    private datastore: DatastoreService
  ) {
    this.parseAttributes(resource);
    this.createHasOneGetters();
    this.createHasManyGetters();
  }

  public get uniqueModelIdentificator(): string {
    return this.links[SELF_PROPERTY_NAME].href;
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  public getHalDocumentClass<T extends this>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, this.constructor);
  }

  public getRelationshipUrl(relationshipName: string): string {
    return this.links[relationshipName] ? this.links[relationshipName].href : '';
  }

  public getPropertyData(propertyName: string): ModelProperty {
    const attributeProperty = this.attributeProperties.find((property: ModelProperty) => property.name === propertyName);
    const hasOneProperty = this.hasOneProperties.find((property: ModelProperty) => property.name === propertyName);
    const hasManyProperty = this.hasManyProperties.find((property: ModelProperty) => property.name === propertyName);
    return attributeProperty || hasOneProperty || hasManyProperty;
  }

  public getEmbeddedResource(resourceName: string): RawHalResource | undefined {
    if (this.resource[resourceName]) {
      return this.resource[resourceName];
    }

    if (!this.resource[EMBEDDED_PROPERTY_NAME]) {
      return;
    }

    return this.resource[EMBEDDED_PROPERTY_NAME][resourceName];
  }

  private get attributeProperties(): Array<ModelProperty> {
    return Reflect.getMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get hasOneProperties(): Array<ModelProperty> {
    return Reflect.getMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get hasManyProperties(): Array<ModelProperty> {
    return Reflect.getMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, this) || [];
  }

  private createHasOneGetters(): void {
    this.hasOneProperties.forEach((property: ModelProperty) => {
      Object.defineProperty(HalModel.prototype, property.name, {
        get: () => {
          const relationshipLinks: RawHalLink = this.resource[LINKS_PROPERTY_NAME][property.name];

          if (!relationshipLinks) {
            return;
          }

          const modelIdentificator: string = relationshipLinks.href;
          return this.datastore.storage.get(modelIdentificator);
        }
      });
    });
  }

  private createHasManyGetters(): void {
    this.hasManyProperties.forEach((property: ModelProperty) => {
      Object.defineProperty(HalModel.prototype, property.name, {
        get: () => {
          return 'Method not implemented';
        }
      });
    });
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributeProperties.forEach((attributeProperty: ModelProperty) => {
      const rawPropertyValue: any = resource[attributeProperty.name];

      // tslint:disable-next-line:max-line-length
      this[attributeProperty.name] = attributeProperty.propertyClass ? new attributeProperty.propertyClass(rawPropertyValue) : rawPropertyValue;
    });
  }

  private get links(): RawHalLinks {
    return this.resource[LINKS_PROPERTY_NAME];
  }
}
