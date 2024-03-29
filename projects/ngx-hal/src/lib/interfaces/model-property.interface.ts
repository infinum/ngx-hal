import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';

export interface ModelProperty {
	type: ModelPropertyEnum;
	propertyClass?: any;
	externalName?: string;
	name: string;
}

export interface AttributeModelProperty extends ModelProperty {
	excludeFromPayload?: boolean;
	transformResponseValue?: (rawAttribute: any) => any;
	transformBeforeSave?: (raw: any) => any;
}

export interface HeaderAttributeModelProperty extends ModelProperty {
	transformResponseValue?: (rawAttribute: any) => any;
	transformBeforeSave?: (raw: any) => any;
}

export interface HasOneModelProperty extends ModelProperty {
	includeInPayload?: boolean;
}

export interface HasManyModelProperty extends ModelProperty {
	includeInPayload?: boolean;
}

export interface LinkProperty extends ModelProperty {
	type: ModelPropertyEnum;
	externalName?: string;
	name: string;
}
