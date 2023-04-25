import { LINK_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { ModelProperty } from '../enums/model-property.enum';
import { getObjProperty } from '../helpers/metadata/metadata.helper';
import { updatePropertyMetadata } from '../helpers/update-property-metadata/update-property-metadata.helper';
import { LinkRelationshipOptions } from '../interfaces/link-relationship-options.interface';
import { LinkProperty } from '../interfaces/model-property.interface';
import { HalModel } from '../models/hal.model';

export function Link(options: LinkRelationshipOptions = {}) {
	return (model: HalModel, propertyName: string) => {
		const existingLinkProperties: Array<LinkProperty> = getObjProperty(
			model,
			LINK_PROPERTIES_METADATA_KEY,
			[],
		);

		const linkProperty: LinkProperty = {
			name: propertyName,
			type: ModelProperty.Link,
			externalName: options.externalName || propertyName,
		};

		updatePropertyMetadata(existingLinkProperties, linkProperty);
	};
}
