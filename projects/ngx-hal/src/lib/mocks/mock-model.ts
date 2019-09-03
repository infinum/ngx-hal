import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasOne } from '../decorators/has-one.decorator';

@ModelConfig({
  type: 'Mock',
  endpoint: 'mock-model-endpoint'
})
export class MockModel extends HalModel {
  @Attribute()
  name: string;

  @HasOne()
  mockModel2Connection: MockModel2;
}
