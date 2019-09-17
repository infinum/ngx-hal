import { ModelProperty } from '../../interfaces/model-property.interface';

export function updateModelPropertiesWithTheNewOne<T extends ModelProperty>(modelProperties: Array<T>, newModelProperty: T): Array<T> {
  const properties: Array<T> = [].concat(modelProperties);

  const existingProperty: T = properties.find((property: T) => {
    return property.name === newModelProperty.name;
  });

  if (existingProperty) {
    const indexOfExistingProperty: number = properties.indexOf(existingProperty);
    properties[indexOfExistingProperty] = newModelProperty;
  } else {
    properties.push(newModelProperty);
  }

  return properties;
}
