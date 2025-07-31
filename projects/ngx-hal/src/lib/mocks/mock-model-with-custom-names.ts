import { Pagination } from '../classes/pagination';
import { HasMany } from '../decorators/has-many.decorator';
import { HasOne } from '../decorators/has-one.decorator';
import { Link } from '../decorators/link.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'ExternalNamesMock',
	endpoint: 'external-names-mock-model-endpoint',
})
export class MockModelWithCustomNames extends HalModel<Pagination> {
	@HasOne({
		includeInPayload: true,
		propertyClass: MockModel2,
		externalName: 'customNameOfMockModel2',
	})
	mockModel2Connection: MockModel2;

	@HasMany({
		itemsType: MockModel2,
		includeInPayload: true,
		externalName: 'customNameOfSomeEmptyResources',
	})
	someEmptyResources: Array<MockModel2>;

	@Link({
		externalName: 'customNameOfSimpleLinkRelationship',
	})
	simpleLinkRelationship: string;
}
