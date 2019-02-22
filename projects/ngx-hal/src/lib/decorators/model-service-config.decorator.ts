import { ModelServiceOptions } from '../interfaces/model-service-options.interface';
import { HAL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';

export function ModelServiceConfig(config: ModelServiceOptions) {
  return function (target: any) {
    Reflect.defineMetadata(HAL_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass, target);
    return target;
  };
}
