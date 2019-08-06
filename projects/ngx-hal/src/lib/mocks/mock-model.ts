import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';

@ModelConfig({
  type: 'Mock',
  endpoint: 'mock-model-endpoint'
})
export class MockModel extends HalModel {
  @Attribute()
  name: string;
}
