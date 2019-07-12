import { NetworkConfig } from './network-config.interface';
import { HalModel } from '../models/hal.model';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';
import { PaginationConstructor } from '../types/pagination.type';
import { CacheStrategy } from '../enums/cache-strategy.enum';

export interface DatastoreOptions {
  network?: NetworkConfig;
  halDocumentClass?: HalDocumentConstructor<HalModel>;
  paginationClass?: PaginationConstructor;
  cacheStrategy?: CacheStrategy;
}
