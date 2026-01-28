import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import {
	ModelOptions,
	DEFAULT_MODEL_OPTIONS,
	DEFAULT_MODEL_TYPE,
} from '../interfaces/model-options.interface';
import { RawHalResource } from '../interfaces/raw-hal-resource.interface';
import {
	ATTRIBUTE_PROPERTIES_METADATA_KEY,
	HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY,
	HAS_ONE_PROPERTIES_METADATA_KEY,
	HAS_MANY_PROPERTIES_METADATA_KEY,
	HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY,
	LINK_PROPERTIES_METADATA_KEY,
} from '../constants/metadata.constant';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import {
	ModelProperty,
	AttributeModelProperty,
	HasOneModelProperty,
	HasManyModelProperty,
	HeaderAttributeModelProperty,
	LinkProperty,
} from '../interfaces/model-property.interface';
import {
	LINKS_PROPERTY_NAME,
	SELF_PROPERTY_NAME,
	EMBEDDED_PROPERTY_NAME,
} from '../constants/hal.constant';
import { LOCAL_DOCUMENT_ID_PREFIX, LOCAL_MODEL_ID_PREFIX } from '../constants/general.constant';
import { DatastoreService } from '../services/datastore/datastore.service';
import { RawHalLink } from '../interfaces/raw-hal-link.interface';
import { RawHalLinks } from '../interfaces/raw-hal-links.interface';
import { HalDocument } from '../classes/hal-document';
import { NetworkConfig } from '../interfaces/network-config.interface';
import { generateUUID } from '../helpers/uuid/uuid.helper';
import { getResponseHeader } from '../utils/get-response-headers/get-response-header.util';
import { isHalModelInstance } from '../helpers/is-hal-model-instance.ts/is-hal-model-instance.helper';
import { PlainHeaders, RequestOptions } from '../types/request-options.type';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { GeneratePayloadOptions } from '../interfaces/generate-payload-options.interface';
import { CustomOptions } from '../interfaces/custom-options.interface';
import { ensureRelationshipRequestDescriptors } from '../utils/ensure-relationship-descriptors/ensure-relationship-descriptors.util';
import { RelationshipRequestDescriptor } from '../types/relationship-request-descriptor.type';
import { removeQueryParams } from '../utils/remove-query-params/remove-query-params.util';
import { setRequestHeader } from '../utils/set-request-header/set-request-header.util';
import { isString } from '../utils/is-string/is-string.util';
import { isFunction } from '../helpers/is-function/is-function.helper';
import { ModelEndpoints } from '../interfaces/model-endpoints.interface';
import { map } from 'rxjs/operators';
import { getArrayObjProperty, getObjProperty } from '../helpers/metadata/metadata.helper';
import { Pagination } from '../classes/pagination';

export abstract class HalModel<
	P extends Pagination,
	Datastore extends DatastoreService<P> = DatastoreService<P>,
> {
	private config: ModelOptions<P> = this['config'] || DEFAULT_MODEL_OPTIONS;
	private temporarySelfLink: string = null;
	private localModelIdentificator: string;
	private internalHasManyDocumentIdentificators: { [K: string]: string } = {};
	public static readonly modelType: string = DEFAULT_MODEL_TYPE;

	constructor(
		protected resource: RawHalResource = {},
		protected datastore: Datastore,
		public rawResponse?: HttpResponse<any>,
	) {
		this.setLocalModelIdentificator();
		this.parseAttributes(resource);
		this.parseHeaderAttributes(rawResponse);
		this.initializeHasOneProperties();
		this.initializeHasManyProperties();
		this.extractEmbeddedProperties(resource);
	}

	public get uniqueModelIdentificator(): string {
		return this.getUniqueModelIdentificator();
	}

	protected getUniqueModelIdentificator(): string {
		return this.selfLink || this.localModelIdentificator;
	}

	public get id(): string {
		if (!this.selfLink) {
			return null;
		}

		const selfLink: string = removeQueryParams(this.selfLink);
		return selfLink.split('/').pop();
	}

	public get endpoint(): string {
		return this.config.endpoint || 'unknownModelEndpoint';
	}

	public get modelEndpoints(): ModelEndpoints {
		return null;
	}

	public get networkConfig(): NetworkConfig {
		return this.config.networkConfig;
	}

	public get type(): string {
		return this.config.type;
	}

	public getHalDocumentClass<T extends HalModel<P>, P extends Pagination>(): HalDocumentConstructor<
		T,
		P
	> {
		return getObjProperty(this, HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, null);
	}

	public getRelationshipUrl(relationshipName: string): string {
		const property: ModelProperty = this.getPropertyData(relationshipName);

		if (!property) {
			console.warn(`Relationship with the name ${relationshipName} is not defined on the model.`);
			return;
		}

		const fieldName: string = property.externalName || relationshipName;
		const url = this.links[fieldName] ? this.links[fieldName].href : '';

		if (!url || url.startsWith(LOCAL_MODEL_ID_PREFIX) || url.startsWith(LOCAL_DOCUMENT_ID_PREFIX)) {
			return null;
		}

		return url;
	}

	public getPropertyData(propertyName: string): ModelProperty {
		const attributeProperty = this.attributeProperties.find(
			(property: ModelProperty) => property.name === propertyName,
		);
		const hasOneProperty = this.hasOneProperties.find(
			(property: ModelProperty) => property.name === propertyName,
		);
		const hasManyProperty = this.hasManyProperties.find(
			(property: ModelProperty) => property.name === propertyName,
		);
		const linkProperty = this.linkProperties.find(
			(property: ModelProperty) => property.name === propertyName,
		);
		return attributeProperty || hasOneProperty || hasManyProperty || linkProperty;
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

	public save(
		requestOptions?: RequestOptions,
		options: CustomOptions<this> = {},
	): Observable<this> {
		const modelClass = Object.getPrototypeOf(this).constructor;
		return this.datastore.save(this, modelClass, requestOptions, options);
	}

	public update(
		requestOptions?: RequestOptions,
		options: CustomOptions<this> = {},
	): Observable<this> {
		return this.datastore.update(this, requestOptions, options);
	}

	public delete(
		requestOptions?: RequestOptions,
		options: CustomOptions<this> = {},
	): Observable<void> {
		return this.datastore.delete(this, requestOptions, options);
	}

	public refetch(
		includeRelationships?: Array<string | RelationshipRequestDescriptor>,
		requestOptions?: RequestOptions,
	): Observable<this> {
		const modelClass = Object.getPrototypeOf(this).constructor;
		return this.datastore
			.findOne(modelClass, undefined, includeRelationships, requestOptions, this.selfLink)
			.pipe(
				map((fetchedModel: this) => {
					this.populateModelMetadata(fetchedModel);
					return this;
				}),
			);
	}

	public generatePayload(options: GeneratePayloadOptions = {}): object {
		const attributePropertiesPayload: object = this.getAttributePropertiesPayload(options);
		const relationshipsPayload: object = this.generateRelationshipsPayload(options);
		const hasRelationshipLinks: boolean = Boolean(Object.keys(relationshipsPayload).length);

		const payload = { ...attributePropertiesPayload };

		if (hasRelationshipLinks) {
			payload[LINKS_PROPERTY_NAME] = relationshipsPayload;
		}

		return payload;
	}

	// Used only when HalModels or HalDocument are passed when creating a new model
	private extractEmbeddedProperties(rawResource: RawHalResource): void {
		const embeddedProperties: object = rawResource[EMBEDDED_PROPERTY_NAME] || {};

		Object.keys(embeddedProperties).forEach((propertyName: string) => {
			const property: ModelProperty = this.getPropertyData(propertyName);
			const isRelationshipProperty: boolean =
				property && (this.isHasOneProperty(property) || this.isHasManyProperty(property));
			const propertyValue = embeddedProperties[propertyName];
			const isHalModelOrDocument: boolean =
				isHalModelInstance(propertyValue) || propertyValue instanceof HalDocument;

			if (isRelationshipProperty && isHalModelOrDocument) {
				this[property.name] = propertyValue;
			}
		});
	}

	private getAttributePropertiesPayload(payloadOptions: GeneratePayloadOptions = {}): object {
		const { specificFields, changedPropertiesOnly } = payloadOptions;

		return this.attributeProperties.reduce((payload: object, property: AttributeModelProperty) => {
			const propertyName: string = property.name;
			const isPropertyExcludedFromPaylaod: boolean = property.excludeFromPayload;
			const isSpecificFieldsSpecified: boolean = specificFields && Boolean(specificFields.length);
			const isSpecificFieldsConditionSatisfied: boolean =
				!isSpecificFieldsSpecified || specificFields.indexOf(propertyName) !== -1;

			if (isPropertyExcludedFromPaylaod || !isSpecificFieldsConditionSatisfied) {
				return payload;
			}

			const externalPropertyName: string = property.externalName;
			const propertyPayload: object = property.transformBeforeSave
				? property.transformBeforeSave(this[propertyName])
				: this[propertyName];

			if (changedPropertiesOnly) {
				const isPropertyChanged: boolean = propertyPayload !== this.resource[propertyName];

				if (isPropertyChanged) {
					payload[externalPropertyName] = propertyPayload;
				}
			} else {
				payload[externalPropertyName] = propertyPayload;
			}

			return payload;
		}, {});
	}

	private generateHasOnePropertyPayload(property: HasOneModelProperty): object {
		const payload: object = {};

		const propertyName: string = property.name;
		const externalPropertyName: string = property.externalName;

		if (!this[propertyName].selfLink) {
			return payload;
		}

		payload[externalPropertyName] = {
			href: this[propertyName].selfLink,
		};

		return payload;
	}

	private generateHasManyPropertyPayload(property: HasManyModelProperty): object {
		const payload: object = {};
		const hasManyPropertyLinks = [];

		const propertyName: string = property.name;
		const externalPropertyName: string = property.externalName;

		// TODO check if this[propertyName] is an array of models or just a HalDocument
		this[propertyName].forEach((model: HalModel<P>) => {
			if (model && model.selfLink) {
				hasManyPropertyLinks.push({
					href: model.selfLink,
				});
			}
		});

		if (hasManyPropertyLinks.length) {
			payload[externalPropertyName] = hasManyPropertyLinks;
		}

		return payload;
	}

	private generateRelationshipsPayload(payloadOptions: GeneratePayloadOptions = {}): object {
		const { specificFields } = payloadOptions;
		const isSpecificFieldsSpecified: boolean = specificFields && Boolean(specificFields.length);

		return [...this.hasOneProperties, ...this.hasManyProperties]
			.filter((property: HasOneModelProperty) => property.includeInPayload)
			.filter(
				(property: HasOneModelProperty) =>
					!isSpecificFieldsSpecified || specificFields.indexOf(property.name) !== -1,
			)
			.reduce((payload: object, property: HasOneModelProperty) => {
				const propertyName: string = property.name;

				if (!this[propertyName]) {
					return payload;
				}

				const isHasOneProperty: boolean = property.type === ModelPropertyEnum.HasOne;
				let propertyPayload: object;

				if (isHasOneProperty) {
					propertyPayload = this.generateHasOnePropertyPayload(property);
				} else {
					propertyPayload = this.generateHasManyPropertyPayload(property);
				}

				Object.assign(payload, propertyPayload);

				return payload;
			}, {});
	}

	public generateHeaders(): PlainHeaders {
		return this.headerAttributeProperties.reduce(
			(headers: PlainHeaders, property: HeaderAttributeModelProperty) => {
				const externalPropertyName: string = property.externalName;
				const propertyName: string = property.name;
				const propertyValue = property.transformBeforeSave
					? property.transformBeforeSave(this[propertyName])
					: this[propertyName];

				return setRequestHeader(headers, externalPropertyName, propertyValue);
			},
			{},
		);
	}

	public get isSaved(): boolean {
		return Boolean(this.id);
	}

	public fetchRelationships(
		relationships:
			| string
			| RelationshipRequestDescriptor
			| Array<string | RelationshipRequestDescriptor>,
		requestOptions: RequestOptions = {},
	): Observable<this> {
		const relationshipsArray: Array<string | RelationshipRequestDescriptor> = [].concat(
			relationships,
		);
		const relationshipDescriptors: Array<RelationshipRequestDescriptor> =
			ensureRelationshipRequestDescriptors(relationshipsArray);
		return this.datastore.fetchModelRelationships(this, relationshipDescriptors, requestOptions);
	}

	public getRelationship<T extends HalModel<P>>(relationshipName: string): T | HalDocument<T, P> {
		const property: ModelProperty = this.getPropertyData(relationshipName);

		if (!property) {
			console.warn(`Relationship with the name ${relationshipName} is not defined on the model.`);
			return;
		}

		if (this.isHasOneProperty(property)) {
			return this.getHasOneRelationship(property) as T;
		} else if (this.isHasManyProperty(property)) {
			return this.getHasManyRelationship(property);
		}
	}

	private get attributeProperties(): Array<AttributeModelProperty> {
		return this.getPropertiesMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY);
	}

	private get headerAttributeProperties(): Array<HeaderAttributeModelProperty> {
		return this.getPropertiesMetadata(HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY);
	}

	private get hasOneProperties(): Array<HasOneModelProperty> {
		return this.getPropertiesMetadata(HAS_ONE_PROPERTIES_METADATA_KEY);
	}

	private get hasManyProperties(): Array<HasManyModelProperty> {
		return this.getPropertiesMetadata(HAS_MANY_PROPERTIES_METADATA_KEY);
	}

	private get linkProperties(): Array<LinkProperty> {
		return this.getPropertiesMetadata(LINK_PROPERTIES_METADATA_KEY);
	}

	private getPropertiesMetadata<T extends ModelProperty>(propertyKey: string): Array<T> {
		const propertiesMetadata: Array<T> = getArrayObjProperty(this, propertyKey);

		const uniqueMetadata: Array<T> = [];

		propertiesMetadata.forEach((property: T) => {
			if (uniqueMetadata.map((metadata: T) => metadata.name).indexOf(property.name) === -1) {
				uniqueMetadata.push(property);
			}
		});

		return uniqueMetadata;
	}

	private initializeHasOneProperties(): void {
		this.hasOneProperties.forEach((property: ModelProperty) => {
			Object.defineProperty(this, property.name, {
				configurable: true,
				get() {
					return this.getHasOneRelationship(property);
				},
				set<T extends HalModel<P>>(value: T) {
					if (isHalModelInstance(value) || !value) {
						this.replaceRelationshipModel(property.externalName, value);
					} else {
						console.warn(
							`Only HalModel instances can be assigned to property: ${property.name}. This will become an error in the next ngx-hal release`,
						);
						// throw new Error(`Only HalModel instances can be assigned to property: ${property.name}`);
					}
				},
			});
		});
	}

	private initializeHasManyProperties(): void {
		this.hasManyProperties.forEach((property: ModelProperty) => {
			Object.defineProperty(this, property.name, {
				configurable: true,
				get() {
					const halDocument: HalDocument<HalModel<P>, P> = this.getHasManyRelationship(property);

					if (!halDocument) {
						return;
					}

					return halDocument.models;
				},
				set<T extends HalModel<P>>(value: Array<T>) {
					const existingHalDocument: HalDocument<HalModel<P>, P> = this.getHasManyRelationship(
						property,
					);

					if (existingHalDocument) {
						existingHalDocument.models = value;
					} else {
						const halDocumentRaw = {
							models: value,
							uniqueModelIdentificator: `${LOCAL_DOCUMENT_ID_PREFIX}-${generateUUID()}`,
						};
						this.updateHasManyDocumentIdentificator(
							property,
							halDocumentRaw.uniqueModelIdentificator,
						);
						this.datastore.storage.save(halDocumentRaw);
					}
				},
			});
		});
	}

	private setProperty(
		modelProperty: AttributeModelProperty | HeaderAttributeModelProperty,
		rawPropertyValue: any,
	): void {
		const propertyValue = modelProperty.transformResponseValue
			? modelProperty.transformResponseValue(rawPropertyValue)
			: rawPropertyValue;

		if (isString(modelProperty.propertyClass)) {
			const propertyClass = this.datastore.findModelClassByType(modelProperty.propertyClass);
			this[modelProperty.name] = new propertyClass(propertyValue);
		} else if (isFunction(modelProperty.propertyClass)) {
			const propertyClass = modelProperty.propertyClass(propertyValue);
			this[modelProperty.name] = new propertyClass(propertyValue);
		} else if (modelProperty.propertyClass) {
			this[modelProperty.name] = new modelProperty.propertyClass(propertyValue);
		} else {
			this[modelProperty.name] = propertyValue;
		}
	}

	private parseAttributes(resource: RawHalResource): void {
		this.attributeProperties.forEach((attributeProperty: AttributeModelProperty) => {
			const rawPropertyValue: any = resource[attributeProperty.externalName];
			this.setProperty(attributeProperty, rawPropertyValue);
		});
	}

	private parseHeaderAttributes(response: HttpResponse<any>): void {
		this.headerAttributeProperties.forEach(
			(headerAttributeProperty: HeaderAttributeModelProperty) => {
				const rawPropertyValue: any = getResponseHeader(
					response,
					headerAttributeProperty.externalName,
				);
				this.setProperty(headerAttributeProperty, rawPropertyValue);
			},
		);
	}

	private getHasOneRelationship<T extends HalModel<P>>(property: ModelProperty): T {
		const relationshipLinks: RawHalLink = this.links[property.externalName];

		if (!relationshipLinks) {
			return;
		}

		const modelIdentificator: string = relationshipLinks.href;

		return this.datastore.storage.get(modelIdentificator);
	}

	private getHasManyRelationship<T extends HalModel<P>>(
		property: ModelProperty,
	): HalDocument<T, P> {
		const uniqueRelationshipIdentificator: string =
			this.hasManyDocumentIdentificators[property.externalName];

		if (!uniqueRelationshipIdentificator) {
			return;
		}

		const halDocument: HalDocument<T, P> = this.datastore.storage.get(
			uniqueRelationshipIdentificator,
		) as HalDocument<T, P>;

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
		return this.links && this.links[SELF_PROPERTY_NAME]
			? this.links[SELF_PROPERTY_NAME].href
			: this.temporarySelfLink;
	}

	public set selfLink(link: string) {
		this.temporarySelfLink = link;
	}

	private replaceRelationshipModel<T extends HalModel<P>>(
		relationshipName: string,
		relationshipModel: T,
	): void {
		this.resource[LINKS_PROPERTY_NAME] = this.resource[LINKS_PROPERTY_NAME] || {
			self: null,
		};

		let relationshipLink = null;
		if (relationshipModel) {
			relationshipLink = {
				href: relationshipModel.uniqueModelIdentificator || relationshipModel.selfLink,
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

	private isHasOneProperty(property: ModelOptions<P>): boolean {
		return property.type === ModelPropertyEnum.HasOne;
	}

	private isHasManyProperty(property: ModelOptions<P>): boolean {
		return property.type === ModelPropertyEnum.HasMany;
	}

	public populateModelMetadata<K extends HalModel<P>>(sourceModel: K) {
		this.resource = sourceModel.resource;
		this.rawResponse = sourceModel.rawResponse;
		this.parseAttributes(this.resource);
		this.parseHeaderAttributes(this.rawResponse);
		this.extractEmbeddedProperties(this.resource);
	}

	public updateHasManyDocumentIdentificator(
		property: HasManyModelProperty,
		identificator: string,
	): void {
		this.hasManyDocumentIdentificators[property.externalName] = identificator;
	}

	public set hasManyDocumentIdentificators(hasManyDocumentIdentificators: { [K: string]: string }) {
		this.internalHasManyDocumentIdentificators = Object.assign({}, hasManyDocumentIdentificators);
	}

	public get hasManyDocumentIdentificators(): { [K: string]: string } {
		return this.internalHasManyDocumentIdentificators;
	}
}
