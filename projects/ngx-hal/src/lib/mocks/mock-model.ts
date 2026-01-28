import { Pagination } from '../classes/pagination';
import { Attribute } from '../decorators/attribute.decorator';
import { HasMany } from '../decorators/has-many.decorator';
import { HasOne } from '../decorators/has-one.decorator';
import { Link } from '../decorators/link.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'Mock',
	endpoint: 'mock-model-endpoint',
})
export class MockModel extends HalModel<Pagination> {
	@Attribute()
	name: string;

	@Attribute()
	prop1: string;

	@HasOne({
		includeInPayload: true,
		propertyClass: MockModel2,
	})
	mockModel2Connection: MockModel2;

	@HasOne({
		propertyClass: MockModel2,
		externalName: 'config',
	})
	mockModel3Connection: MockModel2;

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

	@Link()
	simpleLinkRelationship: string;
}
