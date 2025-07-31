import { Pagination } from '../classes/pagination';
import { Attribute } from '../decorators/attribute.decorator';
import { HasMany } from '../decorators/has-many.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'MockModelWithDefaultValues',
	endpoint: 'mock-model-with-default-values-endpoint',
})
export class MockModelWithDefaultValues extends HalModel<Pagination> {
	@Attribute()
	name = 'test default value';

	@HasMany({
		itemsType: MockModel2,
	})
	someResources: Array<MockModel2> = [];
}
