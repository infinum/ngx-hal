import { DatastoreOptions } from '../interfaces/datastore-options.interface';

export function DatastoreConfig(config: DatastoreOptions) {
  return function (target: any) {
    return class extends target {
      constructor(...args) {
        super(...args);
        this.network = Object.assign(this.network, config.network);
      }
    } as any;
  };
}
