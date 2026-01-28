import { Pagination } from '../classes/pagination';
import { Attribute } from '../decorators/attribute.decorator';
import { ModelConfig } from '../decorators/model-config.decorator';
import { HalModel } from '../models/hal.model';

@ModelConfig({
	type: 'Mock3',
	endpoint: 'Mock3',
})
export class MockModel3 extends HalModel<Pagination> {
	@Attribute()
	name: string;
}
