import { DatastoreOptions } from '../interfaces/datastore-options.interface';
import { HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';
import { DEFAULT_NETWORK_CONFIG } from '../interfaces/network-config.interface';

export function DatastoreConfig(config: DatastoreOptions) {
  return function (target: any) {
    const networkConfig = Object.assign(DEFAULT_NETWORK_CONFIG, config.network || {});
    Object.defineProperty(target.prototype, 'networkConfig', { value: networkConfig, writable: true });
    Reflect.defineMetadata(HAL_DATASTORE_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass, target);
    return target;
  };
}
