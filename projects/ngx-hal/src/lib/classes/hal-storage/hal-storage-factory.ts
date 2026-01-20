import { EtagHalStorage } from '../../classes/hal-storage/etag-hal-storage';
import { SimpleHalStorage } from '../../classes/hal-storage/simple-hal-storage';
import { CacheStrategy } from '../../enums/cache-strategy.enum';
import { Pagination } from '../pagination';
import { HalStorage } from './hal-storage';

export type HalStorageType<P extends Pagination> = SimpleHalStorage<P> | EtagHalStorage<P>;

export function createHalStorage<P extends Pagination>(
	cacheStrategy: CacheStrategy = CacheStrategy.NONE,
	storageInstance: HalStorage<P>,
): HalStorageType<P> {
	let storage: HalStorageType<P>;

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
