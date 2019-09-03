import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';

@ModelConfig({
  type: 'Mock2',
  endpoint: 'Mock2'
})
export class MockModel2 extends HalModel {
  @Attribute()
  name: string;
}
