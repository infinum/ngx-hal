import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';

export interface ModelProperty {
  type: ModelPropertyEnum;
  propertyClass?: any;
  name: string;
}

export interface AttributeModelProperty extends ModelProperty {
  tranformResponseValue?: (rawAttribute: any) => any;
  transformBeforeSave?: (rawAttribute: any) => void;
}
