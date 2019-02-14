import { ModelOptions } from '../interfaces/model-options.interface';

export function ModelConfig(config: ModelOptions) {
  return function (target: any) {
    return class extends target {
      constructor(...args) {
        super(...args);

        this.config = Object.assign(this.config, config);
      }
    } as any;
  };
}
