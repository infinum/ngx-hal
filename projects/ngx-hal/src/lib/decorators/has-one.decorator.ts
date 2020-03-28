import { HalModel } from '../models/hal.model';
import { HAS_ONE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { HasOneModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty } from '../enums/model-property.enum';
import { HasOneOptions, DEFAULT_HAS_ONE_OPTIONS } from '../interfaces/has-one-options.interface';
import { updateModelPropertiesWithTheNewOne } from '../helpers/replace-model-property/replace-model-property.helper';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function HasOne(options: HasOneOptions = {}) {
  return (model: HalModel, propertyName: string) => {
    const hasOneOptions: HasOneOptions = deepmergeWrapper(DEFAULT_HAS_ONE_OPTIONS, options);

    const existingHasOneProperties: Array<HasOneModelProperty> = Reflect.getMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, model) || [];

    const hasOneProperty: HasOneModelProperty = {
      includeInPayload: hasOneOptions.includeInPayload,
      name: propertyName,
      propertyClass: hasOneOptions.propertyClass || Reflect.getMetadata('design:type', model, propertyName),
      type: ModelProperty.HasOne,
      externalName: options.externalName || propertyName
    };

    const hasOneProperties: Array<HasOneModelProperty> = updateModelPropertiesWithTheNewOne(existingHasOneProperties, hasOneProperty);

    Reflect.defineMetadata(HAS_ONE_PROPERTIES_METADATA_KEY, hasOneProperties, model);
  };
}
