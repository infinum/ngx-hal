import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { Pagination } from '../classes/pagination';

@ModelConfig({
	type: 'Mock3',
	endpoint: 'Mock3',
})
export class MockModel3 extends HalModel<Pagination> {
	@Attribute()
	name: string;
}
