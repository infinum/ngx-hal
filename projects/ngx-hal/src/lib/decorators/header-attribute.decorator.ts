import { HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { getObjProperty } from '../helpers/metadata/metadata.helper';
import { updatePropertyMetadata } from '../helpers/update-property-metadata/update-property-metadata.helper';
import {
	DEFAULT_HEADER_ATTRIBUTE_OPTIONS,
	HeaderAttributeOptions,
} from '../interfaces/header-attribute-options.interface';
import {
	AttributeModelProperty,
	HeaderAttributeModelProperty,
} from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function HeaderAttribute(options: HeaderAttributeOptions = {}) {
	return (model: HalModel, propertyName: string) => {
		const headerAttributeOptions: HeaderAttributeOptions = deepmergeWrapper(
			DEFAULT_HEADER_ATTRIBUTE_OPTIONS,
			options,
		);

		const existingHeaderAttributeProperties: Array<AttributeModelProperty> = getObjProperty(
			model,
			HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY,
			[],
		);

		const attributeProperty: HeaderAttributeModelProperty = {
			type: ModelPropertyEnum.HeaderAttribute,
			transformResponseValue: headerAttributeOptions.transformResponseValue,
			transformBeforeSave: headerAttributeOptions.transformBeforeSave,
			name: propertyName,
			externalName: options.externalName || propertyName,
		};

		if (headerAttributeOptions.useClass) {
			attributeProperty.propertyClass = headerAttributeOptions.useClass;
		}

		updatePropertyMetadata(existingHeaderAttributeProperties, attributeProperty);
	};
}
