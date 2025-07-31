import { Pagination } from '../classes/pagination';
import { ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { getObjProperty } from '../helpers/metadata/metadata.helper';
import { updatePropertyMetadata } from '../helpers/update-property-metadata/update-property-metadata.helper';
import {
	AttributeOptions,
	DEFAULT_ATTRIBUTE_OPTIONS,
} from '../interfaces/attribute-options.interface';
import { AttributeModelProperty } from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function Attribute<P extends Pagination>(options: AttributeOptions<P> = {}) {
	return (model: HalModel<P>, propertyName: string) => {
		const attributeOptions: AttributeOptions<P> = deepmergeWrapper(
			DEFAULT_ATTRIBUTE_OPTIONS,
			options,
		);
		const existingAttributeProperties: Array<AttributeModelProperty> = getObjProperty(
			model,
			ATTRIBUTE_PROPERTIES_METADATA_KEY,
			[],
		);

		const attributeProperty: AttributeModelProperty = {
			type: ModelPropertyEnum.Attribute,
			transformResponseValue: attributeOptions.transformResponseValue,
			transformBeforeSave: attributeOptions.transformBeforeSave,
			name: propertyName,
			externalName: options.externalName || propertyName,
			excludeFromPayload: options.excludeFromPayload,
		};

		if (attributeOptions.useClass) {
			attributeProperty.propertyClass = attributeOptions.useClass;
		}

		updatePropertyMetadata(existingAttributeProperties, attributeProperty);
	};
}
