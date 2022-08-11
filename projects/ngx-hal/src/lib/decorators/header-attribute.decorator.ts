import { HalModel } from '../models/hal.model';
import { HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import {
	AttributeModelProperty,
	HeaderAttributeModelProperty,
} from '../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import {
	HeaderAttributeOptions,
	DEFAULT_HEADER_ATTRIBUTE_OPTIONS,
} from '../interfaces/header-attribute-options.interface';
import { updateModelPropertiesWithTheNewOne } from '../helpers/replace-model-property/replace-model-property.helper';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function HeaderAttribute(options: HeaderAttributeOptions = {}) {
	return (model: HalModel, propertyName: string) => {
		const headerAttributeOptions: HeaderAttributeOptions = deepmergeWrapper(
			DEFAULT_HEADER_ATTRIBUTE_OPTIONS,
			options,
		);

		// tslint:disable-next-line:max-line-length
		const existingHeaderAttributeProperties: Array<AttributeModelProperty> =
			Reflect.getMetadata(HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY, model) || [];

		const attributeProperty: HeaderAttributeModelProperty = {
			type: ModelPropertyEnum.HeaderAttribute,
			transformResponseValue: headerAttributeOptions.transformResponseValue,
			transformBeforeSave: headerAttributeOptions.transformBeforeSave,
			name: propertyName,
			externalName: options.externalName || propertyName,
		};

		if (headerAttributeOptions.useClass) {
			if (headerAttributeOptions.useClass === true) {
				const propertyClass = Reflect.getMetadata('design:type', model, propertyName);
				attributeProperty.propertyClass = propertyClass;
			} else {
				attributeProperty.propertyClass = headerAttributeOptions.useClass;
			}
		}

		const headerAttributeProperties: Array<HeaderAttributeModelProperty> =
			updateModelPropertiesWithTheNewOne(existingHeaderAttributeProperties, attributeProperty);

		Reflect.defineMetadata(
			HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY,
			headerAttributeProperties,
			model,
		);
	};
}
