import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';

@ModelConfig({
  type: 'Mock',
  endpoint: 'mock-model-endpoint'
})
export class MockModel extends HalModel {}