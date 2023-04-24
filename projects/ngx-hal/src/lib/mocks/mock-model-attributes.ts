import { Attribute } from '../decorators/attribute.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'MockAttributes',
	endpoint: 'mock-model-endpoint',
})
export class MockModelAttributes extends HalModel {
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
}
