import { ModelServiceOptions } from '../interfaces/model-service-options.interface';

export function ModelServiceConfig(config: ModelServiceOptions) {
  return function (target: any) {
    return target;
  };
}
