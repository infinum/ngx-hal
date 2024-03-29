import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasOne } from '../decorators/has-one.decorator';
import { HasMany } from '../decorators/has-many.decorator';

@ModelConfig({
	type: 'MockTemplated',
	endpoint: 'mock-templated-model-endpoint{?text}',
})
export class MockTemplatedModel extends HalModel {
	@Attribute()
	name: string;

	@Attribute()
	prop1: string;

	@HasOne({
		propertyClass: MockModel2,
		includeInPayload: true,
	})
	mockModel2Connection: MockModel2;

	@HasMany({
		itemsType: MockModel2,
		includeInPayload: true,
	})
	someEmptyResources: Array<MockModel2>;

	@HasMany({
		itemsType: MockModel2,
		includeInPayload: true,
	})
	someResources: Array<MockModel2>;
}
