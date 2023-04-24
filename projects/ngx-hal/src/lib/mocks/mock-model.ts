import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasOne } from '../decorators/has-one.decorator';
import { HasMany } from '../decorators/has-many.decorator';
import { Link } from '../decorators/link.decorator';

@ModelConfig({
	type: 'Mock',
	endpoint: 'mock-model-endpoint',
})
export class MockModel extends HalModel {
	@Attribute()
	name: string;

	@Attribute()
	prop1: string;

	@Attribute({
		useClass: MockModel2,
	})
	prop2: MockModel2;

	@Attribute({
		transformResponseValue: (value: any) => {
			return 'transformed name';
		},
	})
	prop3: string;

	@Attribute({
		useClass: MockModel2,
		transformResponseValue: (value: any) => {
			return Object.assign({ name: 'transformed name' }, value);
		},
	})
	prop4: MockModel2;

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
