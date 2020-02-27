import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import { ATTRIBUTE_PROPERTIES_METADATA_KEY, HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, HAS_ONE_PROPERTIES_METADATA_KEY, HAS_MANY_PROPERTIES_METADATA_KEY, HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { ModelProperty, AttributeModelProperty, HasOneModelProperty, HasManyModelProperty, HeaderAttributeModelProperty } from '../interfaces/model-property.interface';
import { LINKS_PROPERTY_NAME, SELF_PROPERTY_NAME, EMBEDDED_PROPERTY_NAME } from '../constants/hal.constant';
import { LOCAL_DOCUMENT_ID_PREFIX, LOCAL_MODEL_ID_PREFIX } from '../constants/general.constant';
import { DatastoreService } from '../services/datastore/datastore.service';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';
import { HalDocument } from '../classes/hal-document';
import { NetworkConfig } from '../interfaces/network-config.interface';
import { generateUUID } from '../helpers/uuid/uuid.helper';
import { getResponseHeader } from '../utils/get-response-headers/get-response-header.util';
import { isHalModelInstance } from '../helpers/is-hal-model-instance.ts/is-hal-model-instance.helper';
import { RequestOptions } from '../types/request-options.type';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { GeneratePayloadOptions } from '../interfaces/generate-payload-options.interface';
import { CustomOptions } from '../interfaces/custom-options.interface';

export abstract class HalModel {
  private config: ModelOptions = this['config'] || DEFAULT_MODEL_OPTIONS;
  private temporarySelfLink: string = null;
  private localModelIdentificator: string;

  constructor(
    protected resource: RawHalResource = {},
    protected datastore: DatastoreService,
    public rawResponse?: HttpResponse<any>
  ) {
    this.setLocalModelIdentificator();
    this.parseAttributes(resource);
    this.parseHeaderAttributes(rawResponse);
    this.initializeHasOneProperties();
    this.initialzieHasManyProperties();
    this.extractEmbeddedProperties(resource);
  }

  public get uniqueModelIdentificator(): string {
    return this.selfLink || this.localModelIdentificator;
  }

  public get id(): string {
    if (!this.selfLink) {
      return null;
    }

    return this.selfLink.split('/').pop();
  }

  public get endpoint(): string {
    return this.config.endpoint || 'unknownModelEndpoint';
  }

  public get networkConfig(): NetworkConfig {
    return this.config.networkConfig;
  }

  public get type(): string {
    return this.config.type;
  }

  public getHalDocumentClass<T extends this>(): HalDocumentConstructor<T> {
    return Reflect.getMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, this.constructor);
  }

  public getRelationshipUrl(relationshipName: string): string {
    const property: ModelProperty = this.getPropertyData(relationshipName);

    if (!property) {
      console.warn(`Relationship with the name ${relationshipName} is not defined on the model.`);
      return;
    }

    const fieldName: string = property.externalName || relationshipName;
    return this.links[fieldName] ? this.links[fieldName].href : '';
  }

  public getPropertyData(propertyName: string): ModelProperty {
    const attributeProperty = this.attributeProperties.find((property: ModelProperty) => property.name === propertyName);
    const hasOneProperty = this.hasOneProperties.find((property: ModelProperty) => property.name === propertyName);
    const hasManyProperty = this.hasManyProperties.find((property: ModelProperty) => property.name === propertyName);
    return attributeProperty || hasOneProperty || hasManyProperty;
  }

  public getEmbeddedResource(resourceName: string): RawHalResource | undefined {
    const property: ModelProperty = this.getPropertyData(resourceName);

    if (this.resource[property.externalName]) {
      return this.resource[property.externalName];
    }

    if (!this.resource[EMBEDDED_PROPERTY_NAME]) {
      return;
    }

    return this.resource[EMBEDDED_PROPERTY_NAME][property.externalName];
  }

  public save(requestOptions?: RequestOptions, options: CustomOptions<this> = {}): Observable<this> {
    const modelClass = Object.getPrototypeOf(this).constructor;
    return this.datastore.save(this, modelClass, requestOptions, options);
  }

  public update(requestOptions?: RequestOptions, options: CustomOptions<this> = {}): Observable<this> {
    return this.datastore.update(this, requestOptions, options);
  }

  public delete(requestOptions?: RequestOptions, options: CustomOptions<this> = {}): Observable<void> {
    return this.datastore.delete(this, requestOptions, options);
  }

  public generatePayload(options: GeneratePayloadOptions = {}): object {
    if (options.specificFields) {
      return this.generatePayloadWithSpecificPropertiesOnly(options.specificFields, options.changedPropertiesOnly);
    }

    if (options.changedPropertiesOnly) {
      return this.generatePayloadWithChangedProperties();
    }

    return this.generatePayloadWithAllProperties;
  }

  private get generatePayloadWithAllProperties(): object {
    const attributePropertiesPayload: object = this.attributePropertiesPayload;
    const hasOnePropertiesPayload: object = this.hasOnePropertiesPayload;
    const hasManyPropertiesPayload: object = this.hasManyPropertiesPayload;

    const relationshipLinks: object = { ...hasOnePropertiesPayload, ...hasManyPropertiesPayload };
    const hasRelationshipLinks: boolean = Boolean(Object.keys(relationshipLinks).length);

    const payload = { ...attributePropertiesPayload };

    if (hasRelationshipLinks) {
      payload[LINKS_PROPERTY_NAME] = relationshipLinks;
    }

    return payload;
  }

  private generatePayloadWithChangedProperties(): object {
    const attributePropertiesPayload: object = this.attributePropertiesPayload;
    const hasOnePropertiesPayload: object = this.hasOnePropertiesPayload;
    const hasManyPropertiesPayload: object = this.hasManyPropertiesPayload;

    const changedAttributeProperties: object = this.extractChangedPropertiesOnly(attributePropertiesPayload);
    const changedHasOneProperties: object = this.extractChangedPropertiesOnly(hasOnePropertiesPayload);
    const changedHasMannyProperties: object = this.extractChangedPropertiesOnly(hasManyPropertiesPayload);

    const relationshipLinks: object = { ...changedHasOneProperties, ...changedHasMannyProperties };
    const hasRelationshipLinks: boolean = Boolean(Object.keys(relationshipLinks).length);
    console.log(relationshipLinks);
    const payload = { ...changedAttributeProperties };

    if (hasRelationshipLinks) {
      payload[LINKS_PROPERTY_NAME] = relationshipLinks;
    }

    return payload;
  }

  private generatePayloadWithSpecificPropertiesOnly(specificFields: Array<string>, changedPropertiesOnly: boolean = false): object {
    const attributePropertiesPayload: object = this.attributePropertiesPayload;
    const hasOnePropertiesPayload: object = this.hasOnePropertiesPayload;
    const hasManyPropertiesPayload: object = this.hasManyPropertiesPayload;

    const changedAttributeProperties: object = this.extractSpecificProperties(
      attributePropertiesPayload,
      specificFields,
      changedPropertiesOnly
    );

    const changedHasOneProperties: object = this.extractSpecificProperties(
      hasOnePropertiesPayload,
      specificFields,
      changedPropertiesOnly
    );

    const changedHasManyProperties: object = this.extractSpecificProperties(
      hasManyPropertiesPayload,
      specificFields,
      changedPropertiesOnly
    );

    const relationshipLinks: object = { ...changedHasOneProperties, ...changedHasManyProperties };
    const hasRelationshipLinks: boolean = Boolean(Object.keys(relationshipLinks).length);

    const payload = { ...changedAttributeProperties };

    if (hasRelationshipLinks) {
      payload[LINKS_PROPERTY_NAME] = relationshipLinks;
    }

    return payload;
  }

  private extractChangedPropertiesOnly(propertiesPayload: object): object {
    const changedProperties: object = {};

    Object.keys(propertiesPayload).forEach((propertyName: string) => {
      if (propertiesPayload[propertyName] !== this.resource[propertyName]) {
        changedProperties[propertyName] = propertiesPayload[propertyName];
      }
    });

    return changedProperties;
  }

  private extractSpecificProperties(propertiesPayload: object, specificFields: Array<string>, changedPropertiesOnly: boolean) {
    const changedProperties: object = {};

    Object.keys(propertiesPayload).forEach((propertyName: string) => {
      const isPropertyInWantedFields: boolean = specificFields.indexOf(propertyName) !== -1;
      const isChanged: boolean = propertiesPayload[propertyName] !== this.resource[propertyName];

      if (isPropertyInWantedFields && (!changedPropertiesOnly || isChanged)) {
        changedProperties[propertyName] = propertiesPayload[propertyName];
      }
    });

    return changedProperties;
  }

  // Used only when HalModels or HalDocument are passed when creating a new model
  private extractEmbeddedProperties(rawResource: RawHalResource): void {
    const embeddedProperties: object = rawResource[EMBEDDED_PROPERTY_NAME] || {};

    Object.keys(embeddedProperties).forEach((propertyName: string) => {
      const property: ModelProperty = this.getPropertyData(propertyName);
      const isRelationshipProperty: boolean = property && (this.isHasOneProperty(property) || this.isHasManyProperty(property));
      const propertyValue = embeddedProperties[propertyName];
      const isHalModelOrDocument: boolean = isHalModelInstance(propertyValue) || propertyValue instanceof HalDocument;

      if (isRelationshipProperty && isHalModelOrDocument) {
        this[property.name] = propertyValue;
      }
    });
  }

  private get attributePropertiesPayload(): object {
    return this.attributeProperties.reduce((payload: object, property: AttributeModelProperty) => {
      if (property.excludeFromPayload) {
        return payload;
      }
      const propertyName: string = property.name;
      const externalPropertyName: string = property.externalName;
      payload[externalPropertyName] = property.transformBeforeSave ? property.transformBeforeSave(this[propertyName]) : this[propertyName];
      return payload;
    }, {});
  }

  private get hasOnePropertiesPayload(): object {
    return this.hasOneProperties
      .filter((property: HasOneModelProperty) => property.includeInPayload)
      .reduce((payload: object, property: HasOneModelProperty) => {
        const propertyName: string = property.name;
        const externalPropertyName: string = property.externalName;

        if (!this[propertyName]) {
          return payload;
        }

        payload[externalPropertyName] = {
          href: this[propertyName].selfLink
        };

        return payload;
      }, {});
  }

  private get hasManyPropertiesPayload(): object {
    return this.hasManyProperties
      .filter((property: HasManyModelProperty) => property.includeInPayload)
      .reduce((payload: object, property: HasManyModelProperty) => {
        const propertyName: string = property.name;
        const externalPropertyName: string = property.externalName;

        const hasManyPropertyLinks = [];

        if (!this[propertyName]) {
          return payload;
        }

        // TODO check if this[propertyName] is an array of models or just a HalDocument
        this[propertyName].forEach((model: HalModel) => {
          if (!model) {
            return payload;
          }

          hasManyPropertyLinks.push({
            href: model.selfLink
          });
        });

        if (hasManyPropertyLinks.length) {
          payload[externalPropertyName] = hasManyPropertyLinks;
        }

        return payload;
      }, {});
  }

  public generateHeaders(): object {
    return this.headerAttributeProperties.reduce((headers: object, property: HeaderAttributeModelProperty) => {
      const externalPropertyName: string = property.externalName;
      const propertyName: string = property.name;
      headers[externalPropertyName] = property.transformBeforeSave ? property.transformBeforeSave(this[propertyName]) : this[propertyName];
      return headers;
    }, {});
  }

  public get isSaved(): boolean {
    return Boolean(this.id);
  }

  public fetchRelationships(relationshipNames: string | Array<string>): Observable<this> {
    return this.datastore.fetchModelRelationships(this, relationshipNames);
  }

  public getRelationship<T extends HalModel>(relationshipName: string): T | HalDocument<T> {
    const property: ModelProperty = this.getPropertyData(relationshipName);

    const isHasOneProperty: boolean = property.type === ModelPropertyEnum.HasOne;

    if (isHasOneProperty) {
      return this.getHasOneRelationship(property) as T;
    }

    return this.getHasManyRelationship(property);
  }

  private get attributeProperties(): Array<AttributeModelProperty> {
    return Reflect.getMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get headerAttributeProperties(): Array<HeaderAttributeModelProperty> {
    return Reflect.getMetadata(HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get hasOneProperties(): Array<HasOneModelProperty> {
    return Reflect.getMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, this) || [];
  }

  private get hasManyProperties(): Array<HasManyModelProperty> {
    return Reflect.getMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, this) || [];
  }

  private getModelIdentificator(modelClass, modelSelfLink: string): string {
    const model = new modelClass({}, this.datastore);
    model.selfLink = modelSelfLink;
    return model.uniqueModelIdentificator;
  }

  private initializeHasOneProperties(): void {
    this.hasOneProperties.forEach((property: ModelProperty) => {
      Object.defineProperty(HalModel.prototype, property.name, {
        get() {
          return this.getHasOneRelationship(property);
        },
        set<T extends HalModel>(value: T) {
          this.replaceRelationshipModel(property.externalName, value);
        }
      });
    });
  }

  private initialzieHasManyProperties(): void {
    this.hasManyProperties.forEach((property: ModelProperty) => {
      Object.defineProperty(HalModel.prototype, property.name, {
        get() {
          const halDocument: HalDocument<HalModel> = this.getHasManyRelationship(property);

          if (!halDocument) {
            return;
          }

          return halDocument.models;
        },
        set<T extends HalModel>(value: Array<T>) {
          const existingHalDocument: HalDocument<HalModel> = this.getHasManyRelationship(property);

          if (existingHalDocument) {
            existingHalDocument.models = value;
          } else {
            const halDocumentRaw = { models: value, uniqueModelIdentificator: `${LOCAL_DOCUMENT_ID_PREFIX}-${generateUUID()}` };
            this.datastore.storage.save(halDocumentRaw);
            this.replaceRelationshipModel(property.externalName, halDocumentRaw);
          }
        }
      });
    });
  }

  private parseAttributes(resource: RawHalResource): void {
    this.attributeProperties.forEach((attributeProperty: AttributeModelProperty) => {
      const rawPropertyValue: any = resource[attributeProperty.externalName];

      if (attributeProperty.propertyClass) {
        this[attributeProperty.name] = new attributeProperty.propertyClass(rawPropertyValue);
      } else if (attributeProperty.tranformResponseValue) {
        this[attributeProperty.name] = attributeProperty.tranformResponseValue(rawPropertyValue);
      } else {
        this[attributeProperty.name] = rawPropertyValue;
      }
    });
  }

  private parseHeaderAttributes(response: HttpResponse<any>): void {
    this.headerAttributeProperties.forEach((headerAttributeProperty: HeaderAttributeModelProperty) => {
      const rawPropertyValue: any = getResponseHeader(response, headerAttributeProperty.externalName);

      if (headerAttributeProperty.propertyClass) {
        this[headerAttributeProperty.name] = new headerAttributeProperty.propertyClass(rawPropertyValue);
      } else if (headerAttributeProperty.tranformResponseValue) {
        this[headerAttributeProperty.name] = headerAttributeProperty.tranformResponseValue(rawPropertyValue);
      } else {
        this[headerAttributeProperty.name] = rawPropertyValue;
      }
    });
  }

  private getHasOneRelationship<T extends HalModel>(property: ModelProperty): T {
    const relationshipLinks: RawHalLink = this.links[property.externalName];

    if (!relationshipLinks) {
      return;
    }

    let modelIdentificator: string = relationshipLinks.href;
    if (isHalModelInstance(property.propertyClass)) {
      modelIdentificator = this.getModelIdentificator(property.propertyClass, relationshipLinks.href);
    }

    return this.datastore.storage.get(modelIdentificator);
  }

  private getHasManyRelationship<T extends HalModel>(property: ModelProperty): HalDocument<T> {
    const relationshipLink: RawHalLink = this.links[property.externalName];

    if (!relationshipLink) {
      return;
    }

    const modelIdentificator: string = this.getModelIdentificator(property.propertyClass, relationshipLink.href);
    const halDocument: HalDocument<T> = this.datastore.storage.get(modelIdentificator) as HalDocument<T>;

    if (!halDocument) {
      console.warn(`Has many relationship ${property.name} is not fetched.`);
      return;
    }

    return halDocument;
  }

  public get links(): RawHalLinks | { [relationshipName: string]: RawHalLink } {
    return this.resource[LINKS_PROPERTY_NAME] || {};
  }

  public get selfLink(): string {
    return this.links && this.links[SELF_PROPERTY_NAME] ? this.links[SELF_PROPERTY_NAME].href : this.temporarySelfLink;
  }

  public set selfLink(link: string) {
    this.temporarySelfLink = link;
  }

  private replaceRelationshipModel<T extends HalModel>(relationshipName: string, relationshipModel: T): void {
    this.resource[LINKS_PROPERTY_NAME] = this.resource[LINKS_PROPERTY_NAME] || { self: null };

    let relationshipLink = null;
    if (relationshipModel) {
      relationshipLink = {
        href: relationshipModel.selfLink || relationshipModel.uniqueModelIdentificator
      };
    }

    this.resource[LINKS_PROPERTY_NAME][relationshipName] = relationshipLink;

    // Save the model to the storage if it's not already there
    if (!this[relationshipName] && relationshipModel) {
      // TODO should the model be removed from the storage if relationshipModel does not exist?
      this.datastore.storage.save(relationshipModel);
    }
  }

  private setLocalModelIdentificator(): void {
    this.localModelIdentificator = `${LOCAL_MODEL_ID_PREFIX}-${generateUUID()}`;
  }

  private isHasOneProperty(property: ModelOptions): boolean {
    return property.type === ModelPropertyEnum.HasOne;
  }

  private isHasManyProperty(property: ModelOptions): boolean {
    return property.type === ModelPropertyEnum.HasMany;
  }
}
