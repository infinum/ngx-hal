import { Pagination } from '../classes/pagination';
import { HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';
import { setObjProperty } from '../helpers/metadata/metadata.helper';
import { DEFAULT_MODEL_OPTIONS, ModelOptions } from '../interfaces/model-options.interface';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';

export function ModelConfig<P extends Pagination>(config: ModelOptions<P>) {
	return function (target: any) {
		const configValue = deepmergeWrapper<ModelOptions<P>>(DEFAULT_MODEL_OPTIONS, config);
		Object.defineProperty(target.prototype, 'config', {
			value: configValue,
			writable: true,
		});
		setObjProperty(target, HAL_MODEL_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass);
		return target;
	};
}
