import { DatastoreOptions } from '../interfaces/datastore-options.interface';
import { HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';
import { DEFAULT_NETWORK_CONFIG, NetworkConfig } from '../interfaces/network-config.interface';
import { deepmergeWrapper } from '../utils/deepmerge-wrapper';
import { setObjProperty } from '../helpers/metadata/metadata.helper';

export function DatastoreConfig(config: DatastoreOptions) {
	return function (target: any) {
		const networkConfig = deepmergeWrapper<NetworkConfig>(
			DEFAULT_NETWORK_CONFIG,
			config.network || {},
		);
		Object.defineProperty(target.prototype, 'paginationClass', {
			value: config.paginationClass,
		});
		Object.defineProperty(target.prototype, '_cacheStrategy', {
			value: config.cacheStrategy,
		});
		Object.defineProperty(target.prototype, '_storage', {
			value: config.storage,
		});
		Object.defineProperty(target.prototype, 'networkConfig', {
			value: networkConfig,
			writable: true,
		});
		setObjProperty(target, HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass);
		return target;
	};
}
