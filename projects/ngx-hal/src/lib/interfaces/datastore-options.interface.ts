import { NetworkConfig } from './network-config.interface';
import { HalModel } from '../models/hal.model';
import { HalDocumentConstructor } from '../types/hal-document-construtor.type';

export interface DatastoreOptions {
  network?: NetworkConfig;
  halDocumentClass?: HalDocumentConstructor<HalModel>;
}
