import { HalModel } from '../models/hal.model';
import { ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import {
	AttributeOptions,
	DEFAULT_ATTRIBUTE_OPTIONS,
} from '../interfaces/attribute-options.interface';
import { AttributeModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { updateModelPropertiesWithTheNewOne } from '../helpers/replace-model-property/replace-model-property.helper';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function Attribute(options: AttributeOptions = {}) {
	return (model: HalModel, propertyName: string) => {
		const attributeOptions: AttributeOptions = deepmergeWrapper(DEFAULT_ATTRIBUTE_OPTIONS, options);
		const existingAttributeProperties: Array<AttributeModelProperty> =
			Reflect.getMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, model) || [];

		const attributeProperty: AttributeModelProperty = {
			type: ModelPropertyEnum.Attribute,
			transformResponseValue: attributeOptions.transformResponseValue,
			transformBeforeSave: attributeOptions.transformBeforeSave,
			name: propertyName,
			externalName: options.externalName || propertyName,
			excludeFromPayload: options.excludeFromPayload,
		};

		if (attributeOptions.useClass) {
			if (attributeOptions.useClass === true) {
				const propertyClass = Reflect.getMetadata('design:type', model, propertyName);
				attributeProperty.propertyClass = propertyClass;
			} else {
				attributeProperty.propertyClass = attributeOptions.useClass;
			}
		}

		const attributeProperties: Array<AttributeModelProperty> = updateModelPropertiesWithTheNewOne(
			existingAttributeProperties,
			attributeProperty,
		);

		Reflect.defineMetadata(ATTRIBUTE_PROPERTIES_METADATA_KEY, attributeProperties, model);
	};
}
