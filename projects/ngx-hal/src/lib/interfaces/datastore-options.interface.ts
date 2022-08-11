import { NetworkConfig } from './network-config.interface';
import { HalModel } from '../models/hal.model';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { PaginationConstructor } from '../types/pagination.type';
import { CacheStrategy } from '../enums/cache-strategy.enum';
import { HalStorage } from '../classes/hal-storage/hal-storage';

export interface DatastoreOptions {
	network?: NetworkConfig;
	halDocumentClass?: HalDocumentConstructor<HalModel>;
	paginationClass?: PaginationConstructor;
	cacheStrategy?: CacheStrategy;
	storage?: HalStorage;
}
