import { CacheStrategy } from '../../enums/cache-strategy.enum';
import { SimpleHalStorage } from '../../classes/hal-storage/simple-hal-storage';
import { EtagHalStorage } from '../../classes/hal-storage/etag-hal-storage';
import { HalStorage } from './hal-storage';

export type HalStorageType = SimpleHalStorage | EtagHalStorage;

export function createHalStorage(
	cacheStrategy: CacheStrategy = CacheStrategy.NONE,
	storageInstance: HalStorage,
): HalStorageType {
	let storage: HalStorageType;

	switch (cacheStrategy) {
		case CacheStrategy.NONE:
			storage = new SimpleHalStorage();
			break;
		case CacheStrategy.ETAG:
			storage = new EtagHalStorage();
			break;
		case CacheStrategy.CUSTOM:
			if (!storageInstance) {
				throw new Error('When CacheStrategy.CUSTOM is specified, config.storage is required.');
			}
			storage = storageInstance;
			break;
		default:
			throw new Error(`Unknown CacheStrategy: ${cacheStrategy}`);
			break;
	}

	return storage;
}
