import { HalModel } from '../models/hal.model';
import { HAS_MANY_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { HasManyOptions, DEFAULT_HAS_MANY_OPTIONS } from '../interfaces/has-many-options.interface';

export function HasMany(options: HasManyOptions = {}) {
  return (model: HalModel, propertyName: string) => {
    const hasManyOptions = Object.assign(DEFAULT_HAS_MANY_OPTIONS, options);

    const hasManyProperties: Array<ModelProperty> = Reflect.getOwnMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, model) || [];

    const hasManyProperty: ModelProperty = {
      type: ModelPropertyEnum.HasMany,
      name: propertyName
    };

    hasManyProperties.push(hasManyProperty);

    Reflect.defineMetadata(HAS_MANY_PROPERTIES_METADATA_KEY, hasManyProperties, model);
  };
}
