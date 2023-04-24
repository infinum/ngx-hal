import { HAS_MANY_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../enums/model-property.enum';
import { getObjProperty } from '../helpers/metadata/metadata.helper';
import { DEFAULT_HAS_MANY_OPTIONS, HasManyOptions } from '../interfaces/has-many-options.interface';
import { HasManyModelProperty } from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function HasMany(options: HasManyOptions) {
	return (model: HalModel, propertyName: string) => {
		const hasManyOptions: HasManyOptions = deepmergeWrapper(DEFAULT_HAS_MANY_OPTIONS, options);

		const existingHasManyProperties: Array<HasManyModelProperty> = getObjProperty(
			model,
			HAS_MANY_PROPERTIES_METADATA_KEY,
			[],
		);

		const hasManyProperty: HasManyModelProperty = {
			includeInPayload: hasManyOptions.includeInPayload,
			name: propertyName,
			propertyClass: hasManyOptions.itemsType,
			type: ModelProperty.HasMany,
			externalName: options.externalName || propertyName,
		};

		existingHasManyProperties.push(hasManyProperty);
	};
}
