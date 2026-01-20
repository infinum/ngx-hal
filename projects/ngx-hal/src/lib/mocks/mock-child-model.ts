import { Attribute } from '../decorators/attribute.decorator';
import { HasOne } from '../decorators/has-one.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { MockChildModel2 } from './mock-child-model-2';
import { MockModel } from './mock-model';

@ModelConfig({
	type: 'MockChild',
	endpoint: 'mock-child-model-endpoint',
})
export class MockChildModel extends MockModel {
	@Attribute()
	name: string;

	@HasOne({
		propertyClass: MockChildModel2,
	})
	mockModel2Connection: MockChildModel2;
}
