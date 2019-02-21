import { NetworkConfig } from './network-config.interface';
import { HalDocument } from '../classes/hal-document';
import { HalModel } from '../models/hal.model';

export interface DatastoreOptions {
  network?: NetworkConfig;
  halDocumentClass?: {new(...args): HalDocument<HalModel>};
}
