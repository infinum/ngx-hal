import { Pagination } from '../classes/pagination';
import { Attribute } from '../decorators/attribute.decorator';
import { HasMany } from '../decorators/has-many.decorator';
import { HasOne } from '../decorators/has-one.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'Car',
	endpoint: 'car',
})
export class CarModel extends HalModel<Pagination> {
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
