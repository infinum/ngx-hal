import { HalModel } from '../models/hal.model';
import { HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY } from '../constants/metadata.constant';
import { AttributeModelProperty, HeaderAttributeModelProperty } from '../interfaces/model-property.interface';
import { ModelProperty as ModelPropertyEnum } from '../enums/model-property.enum';
import { HeaderAttributeOptions, DEFAULT_HEADER_ATTRIBUTE_OPTIONS } from '../interfaces/header-attribute-options.interface';

export function HeaderAttribute(options: HeaderAttributeOptions = {}) {
  return (model: HalModel, propertyName: string) => {
    const headerAttributeOptions = Object.assign({}, DEFAULT_HEADER_ATTRIBUTE_OPTIONS, options);

    // tslint:disable-next-line:max-line-length
    const headerAttributeProperties: Array<AttributeModelProperty> = Reflect.getOwnMetadata(HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY, model) || [];

    const attributeProperty: HeaderAttributeModelProperty = {
      type: ModelPropertyEnum.HeaderAttribute,
      tranformResponseValue: headerAttributeOptions.transformResponseValue,
      transformBeforeSave: headerAttributeOptions.transformBeforeSave,
      name: propertyName,
      externalName: options.externalName || propertyName
    };

    if (headerAttributeOptions.useClass) {
      if (headerAttributeOptions.useClass === true) {
        const propertyClass = Reflect.getMetadata('design:type', model, propertyName);
        attributeProperty.propertyClass = propertyClass;
      } else {
        attributeProperty.propertyClass = headerAttributeOptions.useClass;
      }
    }

    headerAttributeProperties.push(attributeProperty);

    Reflect.defineMetadata(HEADER_ATTRIBUTE_PROPERTIES_METADATA_KEY, headerAttributeProperties, model);
  };
}
