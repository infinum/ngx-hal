import { HalModel } from '../models/hal.model';
import { HAS_ONE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { HasOneModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty } from '../enums/model-property.enum';
import { HasOneOptions, DEFAULT_HAS_ONE_OPTIONS } from '../interfaces/has-one-options.interface';

export function HasOne(options: HasOneOptions = {}) {
  return (model: HalModel, propertyName: string) => {
    const hasOneOptions = Object.assign({}, DEFAULT_HAS_ONE_OPTIONS, options);

    const hasOneProperties: Array<HasOneModelProperty> = Reflect.getOwnMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, model) || [];

    const hasOneProperty: HasOneModelProperty = {
      includeInPaylaod: hasOneOptions.includeInPayload,
      name: propertyName,
      propertyClass: Reflect.getMetadata('design:type', model, propertyName),
      type: ModelProperty.HasOne
    };

    hasOneProperties.push(hasOneProperty);

    Reflect.defineMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, hasOneProperties, model);
  };
}
