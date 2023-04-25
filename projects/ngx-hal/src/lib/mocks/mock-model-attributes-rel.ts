import { Attribute } from '../decorators/attribute.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';

@ModelConfig({
	type: 'MockAttributesRel',
	endpoint: 'MockAttributesRel',
})
export class MockAttributesRel extends HalModel {
	public static modelType = 'MockAttributesRel';

	@Attribute()
	name: string;
}
