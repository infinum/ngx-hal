import { RawHalResource } from '../interfaces/raw-hal-resource.interface';

export abstract class Pagination {
  constructor(protected rawResource: RawHalResource = {}) { }
}
