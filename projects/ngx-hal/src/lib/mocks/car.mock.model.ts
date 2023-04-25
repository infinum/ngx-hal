import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasOne } from '../decorators/has-one.decorator';
import { HasMany } from '../decorators/has-many.decorator';

@ModelConfig({
	type: 'Car',
	endpoint: 'car',
})
export class CarModel extends HalModel {
	@Attribute({
		externalName: 'name',
	})
	carName: string;

	@HasOne({
		propertyClass: MockModel2,
		includeInPayload: true,
		externalName: 'parentCompany',
	})
	company: MockModel2;

	@HasMany({
		itemsType: MockModel2,
		includeInPayload: true,
		externalName: 'parts',
	})
	carParts: Array<MockModel2>;
}
