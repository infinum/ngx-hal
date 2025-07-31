import { Pagination } from '../classes/pagination';
import { HAS_ONE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../enums/model-property.enum';
import { getObjProperty } from '../helpers/metadata/metadata.helper';
import { updatePropertyMetadata } from '../helpers/update-property-metadata/update-property-metadata.helper';
import { DEFAULT_HAS_ONE_OPTIONS, HasOneOptions } from '../interfaces/has-one-options.interface';
import { HasOneModelProperty } from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function HasOne<P extends Pagination>(options: HasOneOptions<P>) {
	return (model: HalModel<P>, propertyName: string) => {
		const hasOneOptions: HasOneOptions<P> = deepmergeWrapper(DEFAULT_HAS_ONE_OPTIONS, options);

		const existingHasOneProperties: Array<HasOneModelProperty> = getObjProperty(
			model,
			HAS_ONE_PROPERTIES_METADATA_KEY,
			[],
		);

		const hasOneProperty: HasOneModelProperty = {
			includeInPayload: hasOneOptions.includeInPayload,
			name: propertyName,
			propertyClass: hasOneOptions.propertyClass,
			type: ModelProperty.HasOne,
			externalName: options.externalName || propertyName,
		};

		updatePropertyMetadata(existingHasOneProperties, hasOneProperty);
	};
}
