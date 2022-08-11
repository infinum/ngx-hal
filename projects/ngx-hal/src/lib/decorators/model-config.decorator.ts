import { ModelOptions, DEFAULT_MODEL_OPTIONS } from '../interfaces/model-options.interface';
import { HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function ModelConfig(config: ModelOptions) {
	return function (target: any) {
		const configValue = deepmergeWrapper<ModelOptions>(DEFAULT_MODEL_OPTIONS, config);
		Object.defineProperty(target.prototype, 'config', {
			value: configValue,
			writable: true,
		});
		Reflect.defineMetadata(HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass, target);
		return target;
	};
}
