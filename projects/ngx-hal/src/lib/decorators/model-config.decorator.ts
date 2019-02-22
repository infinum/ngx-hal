import { ModelOptions } from '../interfaces/model-options.interface';

export function ModelConfig(config: ModelOptions) {
  return function (target: any) {
    const configValue = Object.assign(this.config, config);
    Object.defineProperty(target.prototype, 'config', { value: configValue });
    return target;
  };
}


