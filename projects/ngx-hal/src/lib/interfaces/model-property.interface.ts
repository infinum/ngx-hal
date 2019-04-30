import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';

export interface ModelProperty {
  type: ModelPropertyEnum;
  propertyClass?: any;
  name: string;
}

export interface AttributeModelProperty extends ModelProperty {
  tranformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (raw: any) => any;
}

export interface HasOneModelProperty extends ModelProperty {
  includeInPaylaod?: boolean;
}

export interface HasManyModelProperty extends ModelProperty {
  includeInPaylaod?: boolean;
}
