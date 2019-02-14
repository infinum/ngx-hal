import { RawHalLink } from './raw-hal-link.interface';

export interface RawHalLinks {
  first?: RawHalLink;
  last?: RawHalLink;
  next?: RawHalLink;
  prev?: RawHalLink;
  self: RawHalLink;
  [K: string]: RawHalLink;
}
