import { DatastoreOptions } from '../interfaces/datastore-options.interface';

export function DatastoreConfig(config: DatastoreOptions) {
  return function (target: any) {
    return class extends target {
      constructor(...args) {
        super(...args);
        this.networkConfig = Object.assign(this.networkConfig, config.network);
      }
    } as any;
  };
}
