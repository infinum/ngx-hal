import { HalModel } from '../models/hal.model';
import { ModelConfig } from '../decorators/model-config.decorator';
import { Attribute } from '../decorators/attribute.decorator';
import { MockModel2 } from './mock-model-2';
import { HasMany } from '../decorators/has-many.decorator';

@ModelConfig({
  type: 'MockModelWithDefaultValues',
  endpoint: 'mock-model-with-default-values-endpoint'
})
export class MockModelWithDefaultValues extends HalModel {
  @Attribute()
  name = 'test default value';

  @HasMany({
    itemsType: MockModel2
  })
  someResources: Array<MockModel2> = [];
}
