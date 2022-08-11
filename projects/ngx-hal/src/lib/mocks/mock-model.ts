import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasOne } from '../decorators/has-one.decorator';
import { HasMany } from '../decorators/has-many.decorator';

@ModelConfig({
	type: 'Mock',
	endpoint: 'mock-model-endpoint',
})
export class MockModel extends HalModel {
	@Attribute()
	name: string;

	@Attribute()
	prop1: string;

	@HasOne({
		includeInPayload: true,
		propertyClass: MockModel2,
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
