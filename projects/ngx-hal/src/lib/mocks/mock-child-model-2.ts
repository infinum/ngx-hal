import { ModelConfig } from '../decorators/model-config.decorator';
import { MockModel2 } from './mock-model-2';

@ModelConfig({
	type: 'MockChild2',
	endpoint: 'MockChild2',
})
export class MockChildModel2 extends MockModel2 {}
