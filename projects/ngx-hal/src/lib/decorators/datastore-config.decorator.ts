import { DatastoreOptions } from '../interfaces/datastore-options.interface';
import { HAL_DOCUMENT_CLASS_METADATA_KEY } from '../constants/metadata.constant';

export function DatastoreConfig(config: DatastoreOptions) {
  return function (target: any) {
    return class extends target {
      constructor(...args) {
        super(...args);
        this.networkConfig = Object.assign(this.networkConfig, config.network);
        Reflect.defineMetadata(HAL_DOCUMENT_CLASS_METADATA_KEY, config.halDocumentClass, this);
      }
    } as any;
  };
}
