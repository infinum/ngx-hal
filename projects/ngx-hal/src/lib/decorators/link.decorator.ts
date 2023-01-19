import { LINK_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../enums/model-property.enum';
import { updateModelPropertiesWithTheNewOne } from '../helpers/replace-model-property/replace-model-property.helper';
import { LinkRelationshipOptions } from '../interfaces/link-relationship-options.interface';
import { LinkProperty } from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';

export function Link(options: LinkRelationshipOptions = {}) {
	return (model: HalModel, propertyName: string) => {
		const existingLinkProperties: Array<LinkProperty> =
			Reflect.getMetadata(LINK_PROPERTIES_METADATA_KEY, model) || [];

		const linkProperty: LinkProperty = {
			name: propertyName,
			type: ModelProperty.Link,
			externalName: options.externalName || propertyName,
		};

		const linkProperties: Array<LinkProperty> = updateModelPropertiesWithTheNewOne(
			existingLinkProperties,
			linkProperty,
		);

		Reflect.defineMetadata(LINK_PROPERTIES_METADATA_KEY, linkProperties, model);
	};
}
