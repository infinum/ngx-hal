import { HalModel } from '../models/hal.model';
import { METADATA_ATTRIBUTE_PROPERTY_NAMES } from '../constants/metadata.constant';

export function Attribute() {
  return (model: HalModel, propertyName: string) => {
    const attributePropertyNames: Array<string> = Reflect.getOwnMetadata(METADATA_ATTRIBUTE_PROPERTY_NAMES, model) || [];
    attributePropertyNames.push(propertyName);
    Reflect.defineMetadata(METADATA_ATTRIBUTE_PROPERTY_NAMES, attributePropertyNames, model);
  };
}
