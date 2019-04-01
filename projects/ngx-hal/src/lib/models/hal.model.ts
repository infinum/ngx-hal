import { Observable } from 'rxjs';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import {
  ATTRIBUTE_PROPERTIES_METADATA_KEY,
  HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY,
  HAS_ONE_PROPERTIES_METADATA_KEY,
  HAS_MANY_PROPERTIES_METADATA_KEY
} from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { ModelProperty, AttributeModelProperty } from '../interfaces/model-property.interface';
import { LINKS_PROPERTY_NAME, SELF_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { DatastoreService } from '../services/datastore/datastore.service';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';
import { HalDocument } from '../classes/hal-document';
import { NetworkConfig } from '../interfaces/network-config.interface';

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

  public get id(): string {
    const selfLink: string = this.links && this.links[SELF_PROPERTY_NAME] ? this.links[SELF_PROPERTY_NAME].href : null;

    if (!selfLink) {
      return null;
    }

    return selfLink.split('/').pop();
  }

  public get endpoint(): string {
    return this.config.endpoint || this.constructor.name;
  }

  public get networkConfig(): NetworkConfig {
    return this.config.networkConfig;
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

  public save(): Observable<this> {
    return this.datastore.save(this);
  }

  public generatePayload(): object {
    return this.attributeProperties.reduce((payload: object, property: ModelProperty) => {
      const propertyName: string = property.name;
      payload[propertyName] = this[propertyName];
      return payload;
    }, {});
  }

  public get isSaved(): boolean {
    return Boolean(this.id);
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
        get() {
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
        get() {
          const relationshipLink: RawHalLink = this.resource[LINKS_PROPERTY_NAME][property.name];

          if (!relationshipLink) {
            return;
          }

          const modelIdentificator: string = relationshipLink.href;
          const halDocument: HalDocument<HalModel> = this.datastore.storage.get(modelIdentificator) as HalDocument<HalModel>;

          return halDocument.models;
        }
      });
    });
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributeProperties.forEach((attributeProperty: AttributeModelProperty) => {
      const rawPropertyValue: any = resource[attributeProperty.name];

      if (attributeProperty.propertyClass) {
        this[attributeProperty.name] = new attributeProperty.propertyClass(rawPropertyValue);
      } else if (attributeProperty.tranformResponseValue) {
        this[attributeProperty.name] = attributeProperty.tranformResponseValue(rawPropertyValue);
      } else {
        this[attributeProperty.name] = rawPropertyValue;
      }
    });
  }

  private get links(): RawHalLinks {
    return this.resource[LINKS_PROPERTY_NAME];
  }
}
