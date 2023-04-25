import { ModelProperty } from '../../interfaces/model-property.interface';

// Modifies the original array
export function updatePropertyMetadata<T extends ModelProperty>(
	modelProperties: Array<T>,
	newModelProperty: T,
): Array<T> {
	const existingProperty: T = modelProperties.find((property: T) => {
		return property.name === newModelProperty.name;
	});

	if (existingProperty) {
		const indexOfExistingProperty: number = modelProperties.indexOf(existingProperty);
		modelProperties[indexOfExistingProperty] = newModelProperty;
	} else {
		modelProperties.push(newModelProperty);
	}

	return modelProperties;
}
