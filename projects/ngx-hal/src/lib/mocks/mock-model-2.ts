import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel3 } from './mock-model-3';
import { HasMany } from '../decorators/has-many.decorator';

@ModelConfig({
	type: 'Mock2',
	endpoint: 'Mock2',
})
export class MockModel2 extends HalModel {
	@Attribute()
	name: string;

	@HasMany({
		itemsType: MockModel3,
	})
	mockModel3s: MockModel3;
}
