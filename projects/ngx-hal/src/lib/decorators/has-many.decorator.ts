import { HalModel } from '../models/hal.model';
import { HAS_MANY_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { HasManyModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty } from '../enums/model-property.enum';
import { HasManyOptions, DEFAULT_HAS_MANY_OPTIONS } from '../interfaces/has-many-options.interface';

export function HasMany(options: HasManyOptions) {
  return (model: HalModel, propertyName: string) => {
    const hasManyOptions = Object.assign({}, DEFAULT_HAS_MANY_OPTIONS, options);

    const hasManyProperties: Array<HasManyModelProperty> = Reflect.getOwnMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, model) || [];

    const hasManyProperty: HasManyModelProperty = {
      includeInPayload: hasManyOptions.includeInPayload,
      name: propertyName,
      propertyClass: hasManyOptions.itemsType,
      type: ModelProperty.HasMany,
      externalName: options.externalName || propertyName
    };

    hasManyProperties.push(hasManyProperty);

    Reflect.defineMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, hasManyProperties, model);
  };
}
