import { HalModel } from '../models/hal.model';
import { metadataConstants } from '../constants/metadata.constants';

export function Attribute() {
  return (model: HalModel, propertyName: string) => {
    const attributePropertyNames: Array<string> = Reflect.getOwnMetadata(metadataConstants.attributePropertyNames, model) || [];
    attributePropertyNames.push(propertyName);
    Reflect.defineMetadata(metadataConstants.attributePropertyNames, attributePropertyNames, model);
  };
}
