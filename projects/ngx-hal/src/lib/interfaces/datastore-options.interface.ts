import { HalStorage } from '../classes/hal-storage/hal-storage';
import { Pagination } from '../classes/pagination';
import { CacheStrategy } from '../enums/cache-strategy.enum';
import { HalModel } from '../models/hal.model';
import { HalDocumentConstructor } from '../types/hal-document-constructor.type';
import { NetworkConfig } from './network-config.interface';

export interface DatastoreOptions<P extends Pagination> {
	network?: NetworkConfig;
	halDocumentClass?: HalDocumentConstructor<HalModel<P>, P>;
	paginationClass?: { new (...args): P };
	cacheStrategy?: CacheStrategy;
	storage?: HalStorage<P>;
}
