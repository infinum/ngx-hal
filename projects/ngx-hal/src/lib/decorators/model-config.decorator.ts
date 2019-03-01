import { ModelOptions } from '../interfaces/model-options.interface';
import { HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';

export function ModelConfig(config: ModelOptions) {
  return function (target: any) {
    const configValue = Object.assign(this.config, config);
    Object.defineProperty(target.prototype, 'config', { value: configValue });
    Reflect.defineMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass, target);
    return target;
  };
}
